import React, { useState } from 'react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    console.log('Signup attempt:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Create Account</h1>
      <hr className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-600 border-0 rounded-full mb-8 mx-auto" />
      
      {/* Social Login */}
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

      {/* Name Input */}
      <div className="group-input flex items-center w-full mb-4">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-user text-gray-500 w-4"></i>
        </div>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {/* Email Input */}
      <div className="group-input flex items-center w-full mb-4">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-envelope text-gray-500 w-4"></i>
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {/* Password Input */}
      <div className="group-input flex items-center w-full mb-4">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-lock text-gray-500 w-4"></i>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {/* Confirm Password Input */}
      <div className="group-input flex items-center w-full mb-6">
        <div className="bg-gray-200 p-3 rounded-l-lg">
          <i className="fa fa-lock text-gray-500 w-4"></i>
        </div>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold uppercase tracking-wider hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        Sign Up
      </button>
    </form>
  );
};

export default Signup;