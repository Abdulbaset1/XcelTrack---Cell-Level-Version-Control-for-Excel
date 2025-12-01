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

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
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

      <div className="flex justify-center space-x-3 mb-6">
        <button type="button" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20">
          <i className="fab fa-google text-blue-300"></i>
        </button>
        <button type="button" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20">
          <i className="fab fa-twitter text-blue-300"></i>
        </button>
        <button type="button" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20">
          <i className="fab fa-linkedin text-blue-300"></i>
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Demo Login Button */}
      <button
        type="button"
        onClick={() => {
          setEmail('demo@xceltrack.com');
          setPassword('demo123');
        }}
        className="w-full mt-4 border border-blue-400/50 text-blue-300 py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-500/10 backdrop-blur-sm transition-all duration-200"
      >
        Fill Demo Credentials
      </button>

      <div className="text-center mt-4">
        <a href="#" className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
          Forgot your password?
        </a>
      </div>
    </form>
  );
};

export default Login;