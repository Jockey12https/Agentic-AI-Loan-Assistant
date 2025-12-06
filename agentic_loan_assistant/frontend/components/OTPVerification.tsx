// components/OTPVerification.tsx - OTP authentication component
'use client';

import { useState, useRef, useEffect } from 'react';

interface OTPVerificationProps {
    customerId: string;
    phoneNumber: string;
    onVerified: () => void;
    onCancel?: () => void;
}

export default function OTPVerification({ customerId, phoneNumber, onVerified, onCancel }: OTPVerificationProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-generate OTP on mount
        generateOTP();
    }, []);

    useEffect(() => {
        // Countdown timer
        if (generatedOtp && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            setError('OTP expired. Please request a new one.');
            setGeneratedOtp(null);
        }
    }, [timeLeft, generatedOtp]);

    const generateOTP = async () => {
        setIsGenerating(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(`http://localhost:8000/auth/generate-otp?customer_id=${customerId}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (data.otp) {
                setGeneratedOtp(data.otp);
                setTimeLeft(300); // Reset timer
                setMessage(`📱 SMS sent to ${phoneNumber}`);
            } else {
                setError('Failed to generate OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.slice(0, 6);
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length && index + i < 6; i++) {
                newOtp[index + i] = pastedData[i];
            }
            setOtp(newOtp);

            // Focus last filled input
            const lastIndex = Math.min(index + pastedData.length, 5);
            inputRefs.current[lastIndex]?.focus();
            return;
        }

        // Single digit input
        if (/^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Auto-verify when all 6 digits entered
            if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
                verifyOTP(newOtp.join(''));
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyOTP = async (otpValue?: string) => {
        const otpToVerify = otpValue || otp.join('');

        if (otpToVerify.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const response = await fetch(
                `http://localhost:8000/auth/verify-otp?customer_id=${customerId}&otp=${otpToVerify}`,
                { method: 'POST' }
            );

            const data = await response.json();

            if (data.verified) {
                setMessage('✅ OTP verified successfully!');
                setTimeout(() => onVerified(), 1000);
            } else {
                setError(data.message || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="otp-verification">
            <div className="otp-header">
                <h3>📱 OTP Verification</h3>
                <p>Enter the 6-digit code sent to {phoneNumber}</p>
            </div>

            {/* SMS Simulation Display (for demo) */}
            {generatedOtp && (
                <div className="sms-simulation">
                    <div className="sms-icon">📨</div>
                    <div className="sms-content">
                        <strong>SMS Simulation (Demo Mode)</strong>
                        <p>Your OTP: <span className="otp-code">{generatedOtp}</span></p>
                        <small>In production, this would be sent via SMS gateway</small>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert error">
                    {error}
                </div>
            )}

            {message && (
                <div className="alert success">
                    {message}
                </div>
            )}

            <div className="otp-input-container">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="otp-input"
                        disabled={isVerifying}
                        autoFocus={index === 0}
                    />
                ))}
            </div>

            <div className="otp-timer">
                {generatedOtp && timeLeft > 0 ? (
                    <span>⏱️ Expires in {formatTime(timeLeft)}</span>
                ) : (
                    <span className="expired">⏱️ OTP Expired</span>
                )}
            </div>

            <div className="otp-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => verifyOTP()}
                    disabled={isVerifying || otp.some(d => !d)}
                >
                    {isVerifying ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={generateOTP}
                    disabled={isGenerating || (timeLeft > 240)}
                >
                    {isGenerating ? 'Sending...' : 'Resend OTP'}
                </button>

                {onCancel && (
                    <button className="btn btn-text" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>

            <style jsx>{`
        .otp-verification {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 500px;
          margin: 0 auto;
        }

        .otp-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .otp-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .otp-header p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .sms-simulation {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .sms-icon {
          font-size: 2rem;
        }

        .sms-content {
          flex: 1;
        }

        .sms-content strong {
          color: #60a5fa;
          font-size: 0.875rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .sms-content p {
          color: #fff;
          margin: 0.5rem 0;
        }

        .otp-code {
          font-size: 1.25rem;
          font-weight: 700;
          color: #3b82f6;
          letter-spacing: 0.2em;
          font-family: monospace;
        }

        .sms-content small {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .alert.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .otp-input-container {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .otp-input {
          width: 3rem;
          height: 3.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          transition: all 0.3s ease;
        }

        .otp-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .otp-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .otp-timer {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .otp-timer .expired {
          color: #f87171;
        }

        .otp-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-text {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          padding: 0.5rem;
        }

        .btn-text:hover {
          color: #fff;
        }

        @media (max-width: 640px) {
          .otp-input {
            width: 2.5rem;
            height: 3rem;
            font-size: 1.25rem;
          }

          .otp-input-container {
            gap: 0.5rem;
          }
        }
      `}</style>
        </div>
    );
}
