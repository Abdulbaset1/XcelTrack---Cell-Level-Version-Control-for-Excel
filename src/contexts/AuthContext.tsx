import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '../firebase';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  role: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  loginWithGithub: () => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let photoURL = firebaseUser.photoURL;
        let role = null;

        try {
          // Fetch additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists() && userDoc.data().photoBase64) {
            photoURL = userDoc.data().photoBase64;
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }

        try {
          // Fetch user role from Backend (PostgreSQL)
          const response = await fetch(`http://localhost:5000/api/user-role/${firebaseUser.uid}`);
          if (response.ok) {
            const data = await response.json();
            role = data.role;
          }
        } catch (error) {
          console.error("Error fetching user role from Backend:", error);
        }

        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoURL: photoURL || null,
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || null,
          role: role
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper to fetch role (and sync if needed)
  const fetchRoleFromBackend = async (uid: string, email?: string, name?: string): Promise<string | null> => {
    try {
      // 1. Try to fetch existing role
      const response = await fetch(`http://localhost:5000/api/user-role/${uid}`);
      if (response.ok) {
        const data = await response.json();
        // If role is found, return it
        if (data.role) return data.role;
      }

      // 2. If no role found (or 404/error), try to sync/create user
      if (email && name) {
        console.log("Role not found, attempting to sync user...");
        const syncResponse = await fetch('http://localhost:5000/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, email, name }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          if (syncData.user && syncData.user.role) {
            return syncData.user.role;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching/syncing user role:", error);
    }
    return null;
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Fetch role (and sync if needed - we pass email/name from the firebase user object)
      const role = await fetchRoleFromBackend(
        userCredential.user.uid, 
        userCredential.user.email || email, 
        userCredential.user.displayName || 'User'
      );

      const userObj: User = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || '',
        email: userCredential.user.email || '',
        photoURL: userCredential.user.photoURL || null,
        emailVerified: userCredential.user.emailVerified,
        createdAt: userCredential.user.metadata.creationTime || null,
        role: role
      };

      return userObj;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Attempt to sync immediately to get the role (explicit call logic integrated)
      const role = await fetchRoleFromBackend(userCredential.user.uid, email, name);

      setUser({
        id: userCredential.user.uid,
        name: name,
        email: email,
        photoURL: null,
        emailVerified: false,
        createdAt: userCredential.user.metadata.creationTime || new Date().toISOString(),
        role: role
      });

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Pass email/name to ensure sync occurs if new user
      const role = await fetchRoleFromBackend(
        result.user.uid, 
        result.user.email || undefined, 
        result.user.displayName || 'Google User'
      );
      return { ...result.user, role } as any; 
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithGithub = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
       // Pass email/name to ensure sync occurs if new user
      const role = await fetchRoleFromBackend(
        result.user.uid, 
        result.user.email || undefined, 
        result.user.displayName || 'GitHub User'
      );
      return { ...result.user, role } as any;
    } catch (error) {
      console.error("Github login error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      console.error("Send verification email error:", error);
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');

      // Check file size (limit to ~500KB for Firestore efficiency)
      if (file.size > 500 * 1024) {
        throw new Error("File size too large. Please upload an image under 500KB.");
      }

      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64String = reader.result as string;

            // Save to Firestore ONLY (Auth profile cannot hold large Base64 strings)
            const userRef = doc(db, 'users', auth.currentUser!.uid);
            await setDoc(userRef, { photoBase64: base64String }, { merge: true });

            // Update local state immediately
            setUser(prev => prev ? { ...prev, photoURL: base64String } : null);
            resolve();
          } catch (error) {
            console.error("Error saving to Firestore:", error);
            reject(error);
          }
        };

        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };

        reader.readAsDataURL(file);
      });

    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    loginWithGoogle,
    loginWithGithub,
    resetPassword,
    sendVerificationEmail,
    uploadProfilePicture,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};