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
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const success = await signup(formData.name, formData.email, formData.password);
      if (success) {
        navigate('/dashboard'); // Redirect to dashboard after signup
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Create Account</h1>
      <hr className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-600 border-0 rounded-full mb-8 mx-auto" />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Social login and form inputs remain the same */}
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

      <div className="text-sm text-gray-500 mb-6">or use your email for registration</div>

      {/* Form inputs remain the same, just add disabled={isLoading} to inputs and button */}
      {/* ... rest of your signup form code ... */}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold uppercase tracking-wider hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default Signup;