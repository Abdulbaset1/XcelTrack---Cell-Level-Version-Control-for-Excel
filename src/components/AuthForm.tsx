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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(/assets/images/sidebarLogin.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for the entire background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div
        className={`
          bg-[rgba(15,23,42,0.25)] backdrop-blur-xl 
          border border-[rgba(255,255,255,0.125)]
          rounded-2xl shadow-2xl relative overflow-hidden 
          w-full max-w-4xl min-h-[600px]
          transition-all duration-1000
          ${isRightPanelActive ? 'right-panel-active' : ''}
        `}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
        }}
        id="container"
      >
        {/* Sign Up Container */}
        <div
          className={`
            absolute top-0 h-full w-1/2 opacity-0 z-10 
            transition-all duration-1000 ease-in-out left-0
            ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : ''}
          `}
        >
          <div className="bg-transparent flex items-center justify-center flex-col h-full px-8 md:px-16 text-center">
            <Signup onSwitchToLogin={handleSignInClick} />
          </div>
        </div>

        {/* Sign In Container */}
        <div
          className={`
            absolute top-0 h-full w-1/2 left-0 z-20 
            transition-all duration-1000 ease-in-out
            ${isRightPanelActive ? 'translate-x-full opacity-0' : 'opacity-100'}
          `}
        >
          <div className="bg-transparent flex items-center justify-center flex-col h-full px-8 md:px-16 text-center">
            <Login onSwitchToSignup={handleSignUpClick} />
          </div>
        </div>

        {/* Overlay Container */}
        <div
          className={`
            absolute top-0 left-1/2 w-1/2 h-full overflow-hidden 
            transition-transform duration-1000 ease-in-out z-30
            ${isRightPanelActive ? '-translate-x-full' : ''}
          `}
        >
          <div
            className={`
              relative -left-full h-full w-[200%] 
              transform transition-transform duration-1000 ease-in-out
              ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}
            `}
            style={{
              backgroundImage: `url(/assets/images/sidebarLogin.jpeg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Lighter overlay for clearer image */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)',
              }}
            ></div>

            {/* Overlay Left */}
            <div className="absolute flex items-center justify-center flex-col py-0 px-4 md:px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-1000 ease-in-out">
              <div
                className="bg-[rgba(255,255,255,0.15)] backdrop-blur-lg border border-[rgba(255,255,255,0.3)] p-6 md:p-8 rounded-2xl max-w-xs"
                style={{
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                }}
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Welcome Back!</h1>
                <p className="text-xs md:text-sm leading-5 tracking-wider mb-6 md:mb-8 text-white/90">
                  To keep connected with your spreadsheets and version history, please login with your personal info
                </p>
                <button
                  className="bg-transparent border-2 border-white/70 rounded-2xl text-white text-xs font-bold py-3 px-8 md:px-12 uppercase transition-all duration-300 ease-in mt-4 hover:bg-white/20 hover:border-white/90 hover:scale-105"
                  onClick={handleSignInClick}
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Overlay Right */}
            <div className="absolute flex items-center justify-center flex-col py-0 px-4 md:px-12 text-center top-0 h-full w-1/2 right-0 transform transition-transform duration-1000 ease-in-out">
              <div
                className="bg-[rgba(255,255,255,0.15)] backdrop-blur-lg border border-[rgba(255,255,255,0.3)] p-6 md:p-8 rounded-2xl max-w-xs"
                style={{
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                }}
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Hello, Friend!</h1>
                <p className="text-xs md:text-sm leading-5 tracking-wider mb-6 md:mb-8 text-white/90">
                  Enter your personal details and start your journey with XcelTrack version control
                </p>
                <button
                  className="bg-transparent border-2 border-white/70 rounded-2xl text-white text-xs font-bold py-3 px-8 md:px-12 uppercase transition-all duration-300 ease-in mt-4 hover:bg-white/20 hover:border-white/90 hover:scale-105"
                  onClick={handleSignUpClick}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;