import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    if (name === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!value) {
        errorMsg = 'Email is required';
      } else if (!emailRegex.test(value)) {
        errorMsg = 'Please enter a valid email address';
      }
    } else if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required';
      }
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (name === 'password' && !touched.email) {
      setTouched(prev => ({ ...prev, email: true }));
      validateField('email', email);
    }
  };

  const isFormValid = () => {
    return email.trim() !== '' && password.trim() !== '' && Object.values(errors).every(err => err === '');
  };

  const { login, loginWithGoogle, loginWithGithub, resetPassword, signup } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // ... existing login logic
      if (user) {
        if (user.role?.toLowerCase() === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
    const testEmail = 'test@xceltrack.com';
    const testPassword = 'password123';

    try {
      // Try to login first
      await login(testEmail, testPassword);
      navigate('/dashboard');
    } catch (err) {
      // If login fails, try to signup
      try {
        await signup('Test User', testEmail, testPassword);
        navigate('/dashboard');
      } catch (signupErr) {
        setError('Failed to create test account. Please try manually.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
    const adminEmail = 'admin@xceltrack.com';
    const adminPassword = 'admin123';

    try {
      // Try to login first
      const user = await login(adminEmail, adminPassword);
      navigate('/admin');
    } catch (err) {
      // If login fails, create the admin account via backend API, then retry
      try {
        const createRes = await fetch('http://localhost:5000/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            name: 'Admin',
            role: 'admin',
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || 'Failed to create admin account');
        }

        // Now login with the newly created admin account
        const user = await login(adminEmail, adminPassword);
        navigate('/admin');
      } catch (createErr: any) {
        setError(`Admin login failed: ${createErr.message || 'Could not create or login as admin.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <h1 className="text-2xl font-bold mb-2 text-white">Sign in to XcelTrack</h1>
      <hr className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 border-0 rounded-full mb-6 mx-auto" />

      {error && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-200 px-4 py-3 rounded-lg mb-4">
          {message}
        </div>
      )}

      {/* Social Buttons */}
      <div className="flex justify-center space-x-3 mb-6">
        {/* ... existing social buttons ... */}
        <button
          type="button"
          aria-label="Sign in with Google"
          onClick={async () => {
            try {
              const user = await loginWithGoogle();
              if (user && user.role?.toLowerCase() === 'admin') {
                navigate('/admin');
              } else {
                navigate('/dashboard');
              }
            } catch (error) {
              console.error(error);
            }
          }}
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20"
        >
          <i className="fab fa-google text-blue-300" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          aria-label="Sign in with GitHub"
          onClick={async () => {
            try {
              const user = await loginWithGithub();
              if (user && user.role?.toLowerCase() === 'admin') {
                navigate('/admin');
              } else {
                navigate('/dashboard');
              }
            } catch (error) {
              console.error(error);
            }
          }}
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20"
        >
          <i className="fab fa-github text-blue-300" aria-hidden="true"></i>
        </button>
      </div>

      <div className="text-sm text-blue-200 mb-6 text-center">or use your email account</div>

      {/* Email Input */}
      <div className="w-full mb-4">
        <div className="flex items-center">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
            <i className="fa fa-envelope text-blue-300 w-4" aria-hidden="true"></i>
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            aria-label="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTouched(prev => ({ ...prev, email: true }));
              validateField('email', e.target.value);
            }}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={`flex-1 p-3 bg-white/10 backdrop-blur-sm border ${touched.email && errors.email ? 'border-red-400' : 'border-white/20'} rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
            required
            disabled={isLoading}
          />
        </div>
        {touched.email && errors.email && (
          <div className="text-red-400 text-xs mt-1 ml-11">{errors.email}</div>
        )}
      </div>

      {/* Password Input */}
      <div className="w-full mb-6">
        <div className="flex items-center">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
            <i className="fa fa-lock text-blue-300 w-4" aria-hidden="true"></i>
          </div>
          <div className="flex-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTouched(prev => ({ ...prev, password: true }));
                validateField('password', e.target.value);
              }}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`w-full p-3 bg-white/10 backdrop-blur-sm border ${touched.password && errors.password ? 'border-red-400' : 'border-white/20'} rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all pr-10`}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors focus:outline-none"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {touched.password && errors.password && (
          <div className="text-red-400 text-xs mt-1 ml-11">{errors.password}</div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !isFormValid()}
        className={`w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 transform shadow-lg
          ${isLoading || !isFormValid()
            ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed border border-gray-400/30'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105 active:scale-95'
          }`}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleTestLogin}
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 transform shadow-lg bg-green-600/80 text-white hover:bg-green-700/80 hover:scale-105 active:scale-95 border border-green-400/30"
        >
          Test Login (No Password)
        </button>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={handleAdminLogin}
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 transform shadow-lg bg-amber-600/80 text-white hover:bg-amber-700/80 hover:scale-105 active:scale-95 border border-amber-400/30"
        >
          🔑 Login as Admin (Testing)
        </button>
      </div>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={async () => {
            setError('');
            setMessage('');
            if (!email) {
              setError('Please enter your email address above to reset your password.');
              return;
            }
            try {
              setIsLoading(true);
              await resetPassword(email);
              setMessage('Password reset email sent! Check your inbox.');
            } catch (err) {
              setError('Failed to send reset email. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }}
          className="text-blue-300 hover:text-blue-200 text-sm transition-colors bg-transparent border-none cursor-pointer"
        >
          Forgot your password?
        </button>
      </div>


    </form>
  );
};

export default Login;