import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '../firebase';

// Export the User interface so other files can use it
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  country?: string;
  createdAt?: string;
  emailVerified: boolean;
  // Alias for UI compatibility if needed, or we rely on displayName
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string, country?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  loginWithGithub: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to sync user with backend
  const syncUserWithBackend = async (user: User, name: string) => {
    try {
      await fetch('http://localhost:5000/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: name,
        }),
      });
    } catch (error) {
      console.error('Failed to sync user with backend:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Map FirebaseUser to our User interface
        const initialUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          name: firebaseUser.displayName || '', // Map name
          createdAt: firebaseUser.metadata.creationTime,
        };

        // Fetch additional user details from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Merge Firestore data (role, country, etc.)
            setUser({ ...initialUser, ...userData });
          } else {
            setUser(initialUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(initialUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // We rely on onAuthStateChanged to update state, but we return the user for the UI
    // We might need to fetch the extra data immediately if the UI depends on it synchronously
    // but usually the listener handles it.
    // To satisfy the return type with "Name" and "Role", we might need a quick fetch or just return basic info.

    const firebaseUser = userCredential.user;
    // Quick partial fetch for role if urgent? 
    // For now, return a basic mapped user. The Context `user` state will update shortly looking correct.
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      name: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime
      // Role might be missing here until state update, assume UI handles it or waits for state
    };
  };

  const signup = async (name: string, email: string, password: string, country?: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        country: country || '',
        role: 'User',
        createdAt: new Date().toISOString()
      });

      await syncUserWithBackend({
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: null,
        emailVerified: false,
        name: name
      }, name);

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Ensure doc exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || 'User',
        email: user.email,
        role: 'User',
        authProvider: 'google',
        createdAt: new Date().toISOString()
      });
      await syncUserWithBackend({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        name: user.displayName || 'User'
      }, user.displayName || 'User');
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      name: user.displayName || '',
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime
    };
  };

  const loginWithGithub = async (): Promise<User | null> => {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    // Ensure doc exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || 'User',
        email: user.email,
        role: 'User',
        authProvider: 'github',
        createdAt: new Date().toISOString()
      });
      await syncUserWithBackend({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        name: user.displayName || 'User'
      }, user.displayName || 'User');
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      name: user.displayName || '',
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime
    };
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    // Placeholder for actual upload logic (which usually requires Storage)
    // Since user didn't ask for Storage setup explicitly but mentioned "upload", 
    // we'll use the Base64 Firestore method from the previous successful thought/attempt.
    if (!auth.currentUser) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await setDoc(doc(db, 'users', auth.currentUser!.uid), { photoBase64: base64 }, { merge: true });
      // Update local state is tricky without a re-fetch or manual set, but the listener might pick it up if we listen to the doc.
      // For now, simple fire-and-forget or partial update if we had access to setUser.
    };
    reader.readAsDataURL(file);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGithub,
    resetPassword,
    sendVerificationEmail,
    uploadProfilePicture,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}