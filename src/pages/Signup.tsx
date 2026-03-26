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
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const { signup, login, loginWithGoogle, loginWithGithub } = useAuth();

  const navigate = useNavigate();

  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    switch (name) {
      case 'name':
        if (!value.trim()) errorMsg = 'Name is required';
        break;
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value) {
          errorMsg = 'Email is required';
        } else if (!emailRegex.test(value)) {
          errorMsg = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          errorMsg = 'Password is required';
        } else if (value.length < 6) {
          errorMsg = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errorMsg = 'Please confirm your password';
        } else if (value !== formData.password) {
          errorMsg = 'Passwords do not match';
        }
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Mark as touched on change to show errors immediately
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);

    // Cross-validate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      if (formData.confirmPassword !== value) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const fieldOrder = ['name', 'email', 'password', 'confirmPassword'];
    const currentIndex = fieldOrder.indexOf(name);

    if (currentIndex > 0) {
      // Mark all previous fields as touched when focusing a later field
      const newTouched = { ...touched };
      for (let i = 0; i < currentIndex; i++) {
        const prevField = fieldOrder[i];
        if (!newTouched[prevField as keyof typeof touched]) {
          newTouched[prevField as keyof typeof touched] = true;
          validateField(prevField, formData[prevField as keyof typeof formData]);
        }
      }
      setTouched(newTouched);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      Object.values(errors).every(err => err === '')
    );
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

  const handleTestLogin = async () => {
    setError('');
    setIsLoading(true);
    const testEmail = 'test@xceltrack.com';
    const testPassword = 'password123';

    try {
      // Try to login first
      await login(testEmail, testPassword);
      navigate('/dashboard');
    } catch (err) {
      // If login fails, try to signup
      try {
        await signup('Test User', testEmail, testPassword);
        navigate('/dashboard');
      } catch (signupErr) {
        setError('Failed to create test account. Please try manually.');
      }
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
            aria-label="Sign up with Google"
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
            <i className="fab fa-google text-blue-300" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            aria-label="Sign up with GitHub"
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
            <i className="fab fa-github text-blue-300" aria-hidden="true"></i>
          </button>
        </div>

        <div className="text-sm text-blue-200 mb-6 text-center">or use your email for registration</div>

        {/* Name Input */}
        <div className="w-full mb-4">
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
              <i className="fa fa-user text-blue-300 w-4" aria-hidden="true"></i>
            </div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              aria-label="Full Name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`flex-1 p-3 bg-white/10 backdrop-blur-sm border ${touched.name && errors.name ? 'border-red-400' : 'border-white/20'} rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
              required
              disabled={isLoading}
            />
          </div>
          {touched.name && errors.name && (
            <div className="text-red-400 text-xs mt-1 ml-11">{errors.name}</div>
          )}
        </div>

        {/* Email Input */}
        <div className="w-full mb-4">
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
              <i className="fa fa-envelope text-blue-300 w-4" aria-hidden="true"></i>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              aria-label="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`flex-1 p-3 bg-white/10 backdrop-blur-sm border ${touched.email && errors.email ? 'border-red-400' : 'border-white/20'} rounded-r-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
              required
              disabled={isLoading}
            />
          </div>
          {touched.email && errors.email && (
            <div className="text-red-400 text-xs mt-1 ml-11">{errors.email}</div>
          )}
        </div>

        {/* Password Input */}
        <div className="w-full mb-4">
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
              <i className="fa fa-lock text-blue-300 w-4" aria-hidden="true"></i>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              aria-label="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`flex-1 p-3 bg-white/10 backdrop-blur-sm border-y border-l ${touched.password && errors.password ? 'border-red-400' : 'border-white/20'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={`bg-white/10 backdrop-blur-sm p-3 rounded-r-lg border-y border-r ${touched.password && errors.password ? 'border-red-400' : 'border-white/20'} border-l-0 hover:bg-white/20 transition-colors`}
            >
              <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-blue-300 w-4`} aria-hidden="true"></i>
            </button>
          </div>
          {touched.password && errors.password && (
            <div className="text-red-400 text-xs mt-1 ml-11">{errors.password}</div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="w-full mb-6">
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-l-lg border border-white/20 border-r-0">
              <i className="fa fa-lock text-blue-300 w-4" aria-hidden="true"></i>
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`flex-1 p-3 bg-white/10 backdrop-blur-sm border-y border-l ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400' : 'border-white/20'} text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className={`bg-white/10 backdrop-blur-sm p-3 rounded-r-lg border-y border-r ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400' : 'border-white/20'} border-l-0 hover:bg-white/20 transition-colors`}
            >
              <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-blue-300 w-4`} aria-hidden="true"></i>
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <div className="text-red-400 text-xs mt-1 ml-11">{errors.confirmPassword}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isFormValid()}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg 
            ${isLoading || !isFormValid()
              ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed border border-gray-400/30'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl'
            }`}
        >
          {isLoading ? 'Sending verification code...' : 'Sign Up'}
        </button>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg bg-green-600/80 text-white hover:bg-green-700/80 hover:shadow-xl border border-green-400/30"
          >
            Test Login (No Password)
          </button>
        </div>

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