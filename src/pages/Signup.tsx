import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import OTPModal from '../components/OTPModal';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const { signup, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Send OTP to email
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Step 2: Show OTP modal
      setShowOTPModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string): Promise<boolean> => {
    try {
      // Verify OTP with backend
      const response = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid OTP');
      }

      // OTP verified! Now create the Firebase account
      const success = await signup(formData.name, formData.email, formData.password);

      if (success) {
        setShowOTPModal(false);
        setAccountCreated(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

        return true;
      }

      return false;
    } catch (err: any) {
      throw new Error(err.message || 'Verification failed');
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to resend OTP');
    }
  };

  const handleCloseOTPModal = () => {
    setShowOTPModal(false);
    setError('');
  };

  // Success screen after account creation
  if (accountCreated) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
        <p className="text-blue-200 mb-6">
          Welcome to XcelTrack, <strong>{formData.name}</strong>!<br />
          Redirecting you to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <>
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
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="bg-white/10 backdrop-blur-sm p-3 rounded-r-lg border border-white/20 border-l-0 hover:bg-white/20 transition-colors"
          >
            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-blue-300 w-4`}></i>
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="flex items-center w-full mb-6">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
            <i className="fa fa-lock text-blue-300 w-4"></i>
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="bg-white/10 backdrop-blur-sm p-3 rounded-r-lg border border-white/20 border-l-0 hover:bg-white/20 transition-colors"
          >
            <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-blue-300 w-4`}></i>
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending verification code...' : 'Sign Up'}
        </button>

        <p className="text-sm text-blue-200 mt-6 text-center">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-white font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </form>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        email={formData.email}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onClose={handleCloseOTPModal}
      />
    </>
  );
};

export default Signup;