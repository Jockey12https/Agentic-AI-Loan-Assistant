// components/VoiceAuth.tsx - Functional Voice authentication component
'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceAuthProps {
  customerId?: string;
  onAuthSuccess?: () => void;
  onAuthFail?: () => void;
}

export default function VoiceAuth({ customerId = 'cust004', onAuthSuccess, onAuthFail }: VoiceAuthProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 200));

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const startRecording = async (isEnrollment: boolean) => {
    try {
      setError(null);
      setMessage(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        }
      });
      streamRef.current = stream;

      // Setup audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      visualizeAudio();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (isEnrollment) {
          await enrollVoice(audioBlob);
        } else {
          await verifyVoice(audioBlob);
        }

        // Cleanup
        stopRecording();
      };

      // Start recording
      mediaRecorder.start();

      if (isEnrollment) {
        setIsEnrolling(true);
      } else {
        setIsVerifying(true);
      }

      // Progress simulation and auto-stop after 5 seconds
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        setRecordingProgress(progress);

        if (progress >= 100) {
          clearInterval(progressInterval);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Microphone access denied. Please allow microphone permission.');
      setIsEnrolling(false);
      setIsVerifying(false);
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  };

  const enrollVoice = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_sample.webm');

      const response = await fetch(`http://localhost:8000/auth/enroll-voice?customer_id=${customerId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.enrolled) {
        setEnrolled(true);
        setMessage('✅ Voice enrolled successfully! You can now verify your identity.');
      } else {
        setError('Failed to enroll voice. Please try again.');
      }
    } catch (err: any) {
      setError('Network error during enrollment. Please try again.');
    } finally {
      setIsEnrolling(false);
      setRecordingProgress(0);
    }
  };

  const verifyVoice = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_verify.webm');

      const response = await fetch(`http://localhost:8000/auth/verify-voice?customer_id=${customerId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.verified) {
        setMessage(`✅ Voice verified! Match: ${data.confidence || 'High'}`);
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        setError(`❌ Voice verification failed. ${data.message || 'Please try again.'}`);
        if (onAuthFail) {
          onAuthFail();
        }
      }
    } catch (err: any) {
      setError('Network error during verification. Please try again.');
    } finally {
      setIsVerifying(false);
      setRecordingProgress(0);
    }
  };

  return (
    <div className="voice-auth">
      <div className="auth-header">
        <h3>🔐 Voice Authentication</h3>
        <p>Secure your transactions with voice biometrics</p>
      </div>

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

      {!enrolled ? (
        <div className="auth-section">
          <div className="auth-icon">🎤</div>
          <h4>Enroll Your Voice</h4>
          <p>Speak clearly: "My voice is my password"</p>

          {isEnrolling ? (
            <div className="recording-container">
              <div className="recording-animation">
                <div className="pulse-ring" style={{ transform: `scale(${1 + audioLevel / 100})` }}></div>
                <div className="pulse-ring delay-1" style={{ transform: `scale(${1 + audioLevel / 150})` }}></div>
                <div className="pulse-ring delay-2" style={{ transform: `scale(${1 + audioLevel / 200})` }}></div>
                <div className="mic-icon">🎙️</div>
              </div>
              <div className="audio-level-bar">
                <div className="audio-level-fill" style={{ width: `${audioLevel}%` }}></div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${recordingProgress}%` }}
                ></div>
              </div>
              <p className="recording-text">Recording... {recordingProgress}%</p>
              <p className="hint-text">Speak now!</p>
            </div>
          ) : (
            <button className="auth-btn primary" onClick={() => startRecording(true)}>
              🎤 Start Enrollment
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
                <div className="pulse-ring verify" style={{ transform: `scale(${1 + audioLevel / 100})` }}></div>
                <div className="pulse-ring verify delay-1" style={{ transform: `scale(${1 + audioLevel / 150})` }}></div>
                <div className="mic-icon">🔊</div>
              </div>
              <div className="audio-level-bar verify">
                <div className="audio-level-fill" style={{ width: `${audioLevel}%` }}></div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill verify"
                  style={{ width: `${recordingProgress}%` }}
                ></div>
              </div>
              <p className="recording-text">Verifying... {recordingProgress}%</p>
              <p className="hint-text">Speak the same phrase!</p>
            </div>
          ) : (
            <button className="auth-btn success" onClick={() => startRecording(false)}>
              🔊 Verify Voice
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
          <span className="feature-text">Real-time verification</span>
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

        .hint-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          margin-top: 0.5rem;
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

        .audio-level-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .audio-level-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.1s ease;
        }

        .audio-level-bar.verify .audio-level-fill {
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
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
