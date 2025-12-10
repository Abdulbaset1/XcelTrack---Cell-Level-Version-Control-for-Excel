import React, { useState, useRef, useEffect } from 'react';

interface OTPModalProps {
    isOpen: boolean;
    email: string;
    onVerify: (otp: string) => Promise<boolean>;
    onResend: () => Promise<void>;
    onClose: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ isOpen, email, onVerify, onResend, onClose }) => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for OTP expiration
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError('OTP has expired. Please request a new one.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take only the last character
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
        setOtp(newOtp);

        // Focus the next empty input or the last one
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await onVerify(otpString);
            if (!success) {
                setError('Invalid OTP. Please try again.');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setLoading(true);
        setError('');

        try {
            await onResend();
            setResendCooldown(60); // 60 second cooldown
            setTimeRemaining(600); // Reset to 10 minutes
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                    <p className="text-gray-600 text-sm">
                        We've sent a 6-digit code to<br />
                        <span className="font-semibold text-gray-800">{email}</span>
                    </p>
                </div>

                {/* OTP Input */}
                <div className="mb-6">
                    <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                                    ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
                                    focus:outline-none focus:ring-2 focus:ring-blue-200`}
                                disabled={loading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-500 text-sm text-center mb-2">{error}</p>
                    )}

                    {/* Timer */}
                    <div className="text-center text-sm text-gray-600">
                        {timeRemaining > 0 ? (
                            <span>Code expires in <span className="font-semibold text-blue-600">{formatTime(timeRemaining)}</span></span>
                        ) : (
                            <span className="text-red-500 font-semibold">Code expired</span>
                        )}
                    </div>
                </div>

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length !== 6 || timeRemaining === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold
                        hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-all duration-200 mb-4"
                >
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* Resend */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Didn't receive the code?{' '}
                        <button
                            onClick={handleResend}
                            disabled={loading || resendCooldown > 0}
                            className="text-blue-600 font-semibold hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OTPModal;
