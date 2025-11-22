import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

const AuthForm: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isRightPanelActive, setIsRightPanelActive] = useState(!isLoginPage);

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div 
        className={`bg-white rounded-2xl shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[600px] ${
          isRightPanelActive ? 'right-panel-active' : ''
        }`}
        id="container"
      >
        {/* Sign Up Container */}
        <div className="absolute top-0 h-full w-1/2 opacity-0 z-10 transition-all duration-600 ease-in-out left-0 sign-up-container">
          <div className="bg-white flex items-center justify-center flex-col h-full px-16 text-center">
            <Signup onSwitchToLogin={handleSignInClick} />
          </div>
        </div>

        {/* Sign In Container */}
        <div className="absolute top-0 h-full w-1/2 left-0 z-20 transition-all duration-600 ease-in-out sign-in-container">
          <div className="bg-white flex items-center justify-center flex-col h-full px-16 text-center">
            <Login onSwitchToSignup={handleSignUpClick} />
          </div>
        </div>

        {/* Overlay Container */}
        <div className="absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out z-30 side-element-container">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 relative -left-full h-full w-[200%] transform transition-transform duration-600 ease-in-out side-element">
            
            {/* Overlay Left */}
            <div className="absolute flex items-center justify-center flex-col py-0 px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-600 ease-in-out side-element-left">
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm leading-5 tracking-wider mb-8">
                To keep connected with your spreadsheets and version history, please login with your personal info
              </p>
              <button 
                className="ghost bg-transparent border-2 border-white rounded-2xl text-white text-xs font-bold py-3 px-12 uppercase transition-transform duration-80 ease-in mt-4"
                onClick={handleSignInClick}
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right */}
            <div className="absolute flex items-center justify-center flex-col py-0 px-12 text-center top-0 h-full w-1/2 right-0 transform transition-transform duration-600 ease-in-out side-element-right">
              <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
              <p className="text-sm leading-5 tracking-wider mb-8">
                Enter your personal details and start your journey with XcelTrack version control
              </p>
              <button 
                className="ghost bg-transparent border-2 border-white rounded-2xl text-white text-xs font-bold py-3 px-12 uppercase transition-transform duration-80 ease-in mt-4"
                onClick={handleSignUpClick}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Add this to your handleSubmit functions in Login and Signup components:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Your authentication logic here...
  
  // After successful login/signup, redirect to dashboard
  // window.location.href = '/dashboard'; // Or use React Router navigation
};
export default AuthForm;