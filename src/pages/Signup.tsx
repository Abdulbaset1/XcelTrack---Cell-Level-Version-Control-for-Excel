import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup, loginWithGoogle, loginWithGithub, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);

  // List of countries
  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "China", "Japan", "Brazil",
    "Pakistan", "Mexico", "Italy", "Spain", "Netherlands", "Switzerland", "Sweden", "Norway", "Denmark", "Finland",
    "Russia", "South Korea", "Singapore", "New Zealand", "Ireland", "South Africa", "UAE", "Saudi Arabia", "Turkey", "Egypt"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (!formData.country) {
        setError('Please select a country');
        setIsLoading(false);
        return;
      }
      const success = await signup(formData.name, formData.email, formData.password, formData.country);
      if (success) {
        await sendVerificationEmail();
        setVerificationSent(true);
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <i className="fas fa-envelope text-green-500 text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-blue-200 mb-6">
          We've sent a verification link to <strong>{formData.email}</strong>.<br />
          Please click the link to verify your account.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-white/10 hover:bg-white/20 text-white py-2 px-6 rounded-lg transition-colors border border-white/20"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <h1 className="text-2xl font-bold mb-2 text-white">Create Account</h1>
      <hr className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 border-0 rounded-full mb-6 mx-auto" />

      {error && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-center space-x-3 mb-6">
        <button
          type="button"
          onClick={async () => {
            try {
              await loginWithGoogle();
              navigate('/dashboard');
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
              await loginWithGithub();
              navigate('/dashboard');
            } catch (error) {
              console.error(error);
            }
          }}
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20"
        >
          <i className="fab fa-github text-blue-300"></i>
        </button>
      </div>

      <div className="text-sm text-blue-200 mb-6 text-center">or use your email for registration</div>

      {/* Name Input */}
      <div className="flex items-center w-full mb-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-user text-blue-300 w-4"></i>
        </div>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          required
          disabled={isLoading}
        />
      </div>

      {/* Country Input */}
      <div className="flex items-center w-full mb-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-globe text-blue-300 w-4"></i>
        </div>
        <div className="flex-1 relative">
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none"
            required
            disabled={isLoading}
          >
            <option value="" className="text-gray-500 bg-[#1a237e]">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country} className="text-white bg-[#1a237e]">{country}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <i className="fas fa-chevron-down text-blue-300 text-xs"></i>
          </div>
        </div>
      </div>

      {/* Email Input */}
      <div className="flex items-center w-full mb-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-envelope text-blue-300 w-4"></i>
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div className="flex items-center w-full mb-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-lock text-blue-300 w-4"></i>
        </div>
        <div className="flex-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
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

      {/* Confirm Password Input */}
      <div className="flex items-center w-full mb-6">
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
          <i className="fa fa-lock text-blue-300 w-4"></i>
        </div>
        <div className="flex-1 relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all pr-10"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors focus:outline-none"
          >
            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form >
  );
};

export default Signup;