// components/VoiceAuth.tsx - Voice authentication component
'use client';

import { useState } from 'react';

interface VoiceAuthProps {
    onAuthSuccess?: () => void;
    onAuthFail?: () => void;
}

export default function VoiceAuth({ onAuthSuccess, onAuthFail }: VoiceAuthProps) {
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);

    const startEnrollment = () => {
        setIsEnrolling(true);
        setRecordingProgress(0);

        // Simulate recording progress
        const interval = setInterval(() => {
            setRecordingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsEnrolling(false);
                    setEnrolled(true);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    const startVerification = () => {
        setIsVerifying(true);
        setRecordingProgress(0);

        // Simulate verification
        const interval = setInterval(() => {
            setRecordingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsVerifying(false);
                    // Simulate success
                    if (onAuthSuccess) {
                        onAuthSuccess();
                    }
                    return 100;
                }
                return prev + 15;
            });
        }, 200);
    };

    return (
        <div className="voice-auth">
            <div className="auth-header">
                <h3>🔐 Voice Authentication</h3>
                <p>Secure your transactions with voice biometrics</p>
            </div>

            {!enrolled ? (
                <div className="auth-section">
                    <div className="auth-icon">🎤</div>
                    <h4>Enroll Your Voice</h4>
                    <p>Record your voice to create a unique biometric signature</p>

                    {isEnrolling ? (
                        <div className="recording-container">
                            <div className="recording-animation">
                                <div className="pulse-ring"></div>
                                <div className="pulse-ring delay-1"></div>
                                <div className="pulse-ring delay-2"></div>
                                <div className="mic-icon">🎙️</div>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${recordingProgress}%` }}
                                ></div>
                            </div>
                            <p className="recording-text">Recording... {recordingProgress}%</p>
                        </div>
                    ) : (
                        <button className="auth-btn primary" onClick={startEnrollment}>
                            Start Enrollment
                        </button>
                    )}
                </div>
            ) : (
                <div className="auth-section">
                    <div className="auth-icon success">✓</div>
                    <h4>Voice Enrolled Successfully!</h4>
                    <p>Verify your identity to proceed with transactions</p>

                    {isVerifying ? (
                        <div className="recording-container">
                            <div className="recording-animation">
                                <div className="pulse-ring verify"></div>
                                <div className="pulse-ring verify delay-1"></div>
                                <div className="mic-icon">🔊</div>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill verify"
                                    style={{ width: `${recordingProgress}%` }}
                                ></div>
                            </div>
                            <p className="recording-text">Verifying... {recordingProgress}%</p>
                        </div>
                    ) : (
                        <button className="auth-btn success" onClick={startVerification}>
                            Verify Voice
                        </button>
                    )}
                </div>
            )}

            <div className="auth-features">
                <div className="feature">
                    <span className="feature-icon">🛡️</span>
                    <span className="feature-text">Bank-grade security</span>
                </div>
                <div className="feature">
                    <span className="feature-icon">⚡</span>
                    <span className="feature-text">Instant verification</span>
                </div>
                <div className="feature">
                    <span className="feature-icon">🔒</span>
                    <span className="feature-text">Encrypted storage</span>
                </div>
            </div>

            <style jsx>{`
        .voice-auth {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-header p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .auth-section {
          text-align: center;
          padding: 2rem 1rem;
        }

        .auth-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        .auth-icon.success {
          color: #10b981;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .auth-section h4 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .auth-section p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
        }

        .auth-btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .auth-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        .auth-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
          color: #fff;
        }

        .auth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .recording-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .recording-animation {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid #667eea;
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }

        .pulse-ring.verify {
          border-color: #10b981;
        }

        .pulse-ring.delay-1 {
          animation-delay: 0.5s;
        }

        .pulse-ring.delay-2 {
          animation-delay: 1s;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .mic-icon {
          font-size: 3rem;
          z-index: 1;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .progress-fill.verify {
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
        }

        .recording-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .auth-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .feature-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        @media (max-width: 768px) {
          .auth-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
