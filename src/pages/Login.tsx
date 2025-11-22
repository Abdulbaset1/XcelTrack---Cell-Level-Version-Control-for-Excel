import React, { useState } from 'react';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Sign in to XcelTrack</h1>
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
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold uppercase tracking-wider hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        Sign In
      </button>

      <a href="#" className="text-green-600 hover:text-green-800 text-sm mt-4 block">
        Forgot your password?
      </a>
    </form>
  );
};

export default Login;