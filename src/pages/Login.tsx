import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');

  const { login, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();
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
          <i className="fab fa-google text-blue-300"></i>
        </button>
        <button
          type="button"
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
          <i className="fab fa-github text-blue-300"></i>
        </button>
      </div>

      <div className="text-sm text-blue-200 mb-6 text-center">or use your email account</div>

      {/* Email Input */}
      <div className="flex items-center w-full mb-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-envelope text-blue-300 w-4"></i>
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div className="flex items-center w-full mb-6">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-lock text-blue-300 w-4"></i>
        </div>
        <div className="flex-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all pr-10"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors focus:outline-none"
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

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