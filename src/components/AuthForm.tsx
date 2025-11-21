import React, { useState } from 'react';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Sliding Forms Container */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl">
          <div className={`flex transition-transform duration-500 ease-in-out ${
            isLogin ? 'translate-x-0' : '-translate-x-1/2'
          }`} style={{ width: '200%' }}>
            
            {/* Login Form - Takes first half */}
            <div className="w-1/2 px-8 py-10">
              <Login onSwitchToSignup={() => setIsLogin(false)} />
            </div>
            
            {/* Signup Form - Takes second half */}
            <div className="w-1/2 px-8 py-10">
              <Signup onSwitchToLogin={() => setIsLogin(true)} />
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="bg-white text-blue-600 px-6 py-2 rounded-full shadow-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {isLogin ? 'Create Account' : 'Already have account?'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;