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
        navigate('/dashboard'); // Redirect to dashboard after login
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Sign in to XcelTrack</h1>
      <hr className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-600 border-0 rounded-full mb-8 mx-auto" />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Social Login and form inputs remain the same */}
      <div className="flex justify-center space-x-3 mb-6 social-login">
        <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
          <i className="fab fa-google text-gray-600"></i>
        </a>
        <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
          <i className="fab fa-twitter text-gray-600"></i>
        </a>
        <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
          <i className="fab fa-linkedin text-gray-600"></i>
        </a>
      </div>

      <div className="text-sm text-gray-500 mb-6">or use your email account</div>

      {/* Email Input */}
      <div className="group-input flex items-center w-full mb-4">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-envelope text-gray-500 w-4"></i>
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div className="group-input flex items-center w-full mb-6">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-lock text-gray-500 w-4"></i>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold uppercase tracking-wider hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="w-full mt-4 border border-green-500 text-green-600 py-3 px-6 rounded-2xl font-bold uppercase tracking-wider hover:bg-green-50 transition-all duration-200"
      >
        Fill Demo Credentials
      </button>

      <a href="#" className="text-green-600 hover:text-green-800 text-sm mt-4 block">
        Forgot your password?
      </a>
    </form>
  );
};

export default Login;