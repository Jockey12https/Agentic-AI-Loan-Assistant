'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import CreditScoreGauge from '../components/CreditScoreGauge';
import LoanCalculator from '../components/LoanCalculator';
import MoodIndicator from '../components/MoodIndicator';
import VoiceAuth from '../components/VoiceAuth';
import OTPVerification from '../components/OTPVerification';

interface Message {
  role: string;
  text: string;
  timestamp: Date;
  decision?: string;
  emi?: number;
  credit_score?: number;
  mood?: 'happy' | 'frustrated' | 'anxious' | 'confused' | 'neutral';
}

export default function Home() {
  const [customerId, setCustomerId] = useState('cust004');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [showCalculator, setShowCalculator] = useState(true);
  const [showVoiceAuth, setShowVoiceAuth] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [currentMood, setCurrentMood] = useState<'happy' | 'frustrated' | 'anxious' | 'confused' | 'neutral'>('neutral');
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Read customer ID from URL parameter (from dashboard)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCustomerId = params.get('customerId');
      if (urlCustomerId) {
        setCustomerId(urlCustomerId);
      }
    }
  }, []);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          addMessage('user', transcript);
          sendMessageToBackend(transcript);
          setIsRecording(false);
        };

        rec.onerror = (e: any) => {
          setError(`Speech recognition error: ${e.error}`);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      } else {
        setError('Your browser does not support the Web Speech API. Please use Chrome or Edge.');
      }
    }
  }, []);

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUserPhone(data.phone || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const detectMood = (text: string): 'happy' | 'frustrated' | 'anxious' | 'confused' | 'neutral' => {
    const lowerText = text.toLowerCase();

    if (/urgent|asap|quickly|frustrated|annoyed|problem/i.test(lowerText)) {
      return 'frustrated';
    }
    if (/worried|concerned|nervous|afraid|unsure|help/i.test(lowerText)) {
      return 'anxious';
    }
    if (/great|excellent|perfect|wonderful|thanks|thank you/i.test(lowerText)) {
      return 'happy';
    }
    if (/confused|don't understand|unclear|what|how|\?/i.test(lowerText)) {
      return 'confused';
    }
    return 'neutral';
  };

  const addMessage = (role: string, text: string, decision?: string, emi?: number, credit_score?: number) => {
    const mood = role === 'user' ? detectMood(text) : currentMood;
    if (role === 'user') {
      setCurrentMood(mood);
    }
    setMessages(prev => [...prev, { role, text, timestamp: new Date(), decision, emi, credit_score, mood }]);
  };

  const startRecording = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsRecording(true);
        setError(null);
      } catch (e) {
        setError('Could not start recording. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const sendTextMessage = () => {
    if (textInput.trim()) {
      addMessage('user', textInput);
      sendMessageToBackend(textInput);
      setTextInput('');
    }
  };

  const sendMessageToBackend = async (text: string) => {
    setIsTyping(true);

    const payload: any = {
      customer_id: customerId || 'cust001',
      message: text,
      user_data: userData,
    };

    // Detect amount in text
    let reqAmount = null;
    const lowerText = text.toLowerCase().replace(/,/g, ''); // Remove commas for easier parsing

    // Check for "Lakh" (e.g., 2.5 lakh, 10 lakhs)
    const lakhMatch = lowerText.match(/(\d+(\.\d+)?)\s*lakhs?/);
    if (lakhMatch) {
      reqAmount = parseFloat(lakhMatch[1]) * 100000;
    }
    // Check for "k" (e.g., 50k)
    else if (lowerText.match(/(\d+(\.\d+)?)\s*k/)) {
      const kMatch = lowerText.match(/(\d+(\.\d+)?)\s*k/);
      if (kMatch) reqAmount = parseFloat(kMatch[1]) * 1000;
    }
    // Check for raw numbers (e.g., 200000) - avoiding small numbers like "2" or "3" unless context implies
    else {
      const numMatch = text.match(/(\d+(\.\d+)?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[0].replace(/,/g, ''));
        if (val > 1000) reqAmount = val; // Only treat as amount if > 1000 to avoid capturing "2 years"
      }
    }

    if (reqAmount) {
      payload.requested_amount = reqAmount;
      payload.tenure_months = 60;
    }

    try {
      const response = await fetch('http://localhost:8000/master/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        addMessage('error', `HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        setIsTyping(false);
        return;
      }

      const data = await response.json();

      setIsTyping(false);

      // Add all response messages
      if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach((msg: any) => {
          addMessage(msg.agent || 'system', msg.text, msg.decision, msg.emi, msg.credit_score);

          // Update credit score if provided
          if (msg.credit_score) {
            setCreditScore(msg.credit_score);
          }

          // Persistence Logic: Update Firestore on Approval
          if (msg.decision === 'approved' && user) {
            const amount = msg.amount || payload.requested_amount || 150000;
            const emi = msg.emi || 0;
            setDoc(doc(db, 'users', user.uid), {
              loanStatus: 'Active',
              currentLoanAmount: amount,
              monthlyEMI: emi,
              lastUpdated: new Date().toISOString()
            }, { merge: true });
          }

          // Sanction Letter Persistence
          if (msg.download_url && user) {
            setDoc(doc(db, 'users', user.uid), {
              sanctionLetterUrl: msg.download_url
            }, { merge: true });
          }

          // File Upload Trigger
          if (msg.action_required === 'upload_salary_slip') {
            setShowUpload(true);
          }
        });
      }

      setError(null);
    } catch (e: any) {
      setIsTyping(false);
      addMessage('error', `Network error: ${e.toString()}`);
      setError('Failed to connect to backend. Make sure the server is running on http://localhost:8000');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8000/upload/salary-slip?customer_id=${customerId}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setShowUpload(false);
        addMessage('user', `[Uploaded ${file.name}]`);
        // Notify backend that upload is done
        sendMessageToBackend("I have uploaded the salary slip.");
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const getMessageClass = (role: string) => {
    switch (role) {
      case 'user':
        return 'user';
      case 'system':
        return 'system';
      case 'error':
        return 'error';
      case 'sales':
      case 'verification':
      case 'underwriting':
        return role;
      default:
        return 'agent';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🤖 LoanBot AI Assistant</h1>
        <p>Your intelligent loan companion powered by advanced AI</p>
        {currentMood !== 'neutral' && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <MoodIndicator mood={currentMood} />
          </div>
        )}
      </div>

      <div className="content">
        {showUpload && (
          <div className="glass-card" style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '500px',
            zIndex: 1000,
            background: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #fbbf24',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>📄 Document Upload Required</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>Please upload your <strong>Salary Slip</strong> (PDF containing "Salary") to proceed.</p>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.jpg,.png"
              style={{ color: 'white', width: '100%', marginBottom: '0.5rem' }}
            />
            {isUploading && <p style={{ color: '#fbbf24' }}>Uploading & Verifying...</p>}
            <button
              onClick={() => setShowUpload(false)}
              style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <div className={`status ${error.includes('error') ? 'error' : 'info'}`}>
            {error}
          </div>
        )}

        <div className="glass-card">
          <div className="input-group">
            <label htmlFor="customerId">Customer ID</label>
            <input
              id="customerId"
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder={customerId ? customerId : "Enter customer ID"}
              readOnly={!!customerId}

            />
          </div>
        </div>

        {/* OTP Verification - Required before chat */}
        {!isOTPVerified && (
          <div className="glass-card" style={{ border: '2px solid rgba(59, 130, 246, 0.5)' }}>
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <h3 style={{ color: '#60a5fa', fontSize: '1.1rem', marginBottom: '0.5rem' }}>🔐 Authentication Required</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>Please verify your identity to access the chat</p>
            </div>
            {userPhone ? (
              <OTPVerification
                customerId={customerId}
                phoneNumber={userPhone}
                onVerified={() => {
                  setIsOTPVerified(true);
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                <p>⚠️ Phone number not found</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Please complete your KYC in the dashboard to add your phone number</p>
              </div>
            )}
          </div>
        )}

        {isOTPVerified && (
          <div className="glass-card" style={{ border: '2px solid rgba(16, 185, 129, 0.5)', padding: '1rem', textAlign: 'center' }}>
            <span style={{ color: '#10b981', fontSize: '1rem', fontWeight: 600 }}>✅ Verified - You can now chat!</span>
          </div>
        )}

        {/* Enhanced Features Section */}
        <div className="features-grid">
          {creditScore && (
            <div className="glass-card">
              <CreditScoreGauge score={creditScore} />
            </div>
          )}

          {showCalculator && (
            <div className="glass-card">
              <LoanCalculator maxAmount={250000} />
            </div>
          )}
        </div>

        {/* Voice Authentication Toggle */}
        <div className="glass-card">
          <button
            className="btn btn-secondary"
            onClick={() => setShowVoiceAuth(!showVoiceAuth)}
            style={{ width: '100%' }}
          >
            {showVoiceAuth ? '� Hide Voice Auth' : '� Setup Voice Authentication'}
          </button>
        </div>

        {showVoiceAuth && (
          <div className="glass-card">
            <VoiceAuth />
          </div>
        )}

        <div className="chat-log" ref={chatLogRef}>
          {!isOTPVerified ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa' }}>Authentication Required</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Please verify your OTP above to start chatting
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p>No messages yet. Start a conversation!</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Try: "Hello" or "I need a loan of 50000"
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${getMessageClass(msg.role)}`}>
                  <div className="message-header">
                    <strong>{msg.role}</strong>
                    {msg.mood && msg.role === 'user' && (
                      <MoodIndicator mood={msg.mood} />
                    )}
                  </div>
                  <div className="message-text">{msg.text}</div>
                  {msg.decision && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.85rem',
                      opacity: 0.8,
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Decision: {msg.decision}
                    </div>
                  )}
                  {msg.emi && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#10b981'
                    }}>
                      💰 EMI: INR {msg.emi.toLocaleString('en-IN')}/month
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Controls - Fixed at Bottom */}
        <div className="glass-card">
          <div className="controls">
            <button
              className="btn btn-primary"
              onClick={startRecording}
              disabled={!isOTPVerified || isRecording || !recognition}
              title={!isOTPVerified ? "Please verify OTP first" : ""}
            >
              {isRecording ? (
                <>
                  <span className="recording-indicator"></span>
                  <span>Recording...</span>
                  <div className="voice-waveform">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              ) : (
                <>
                  🎤 Start Voice
                </>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={stopRecording}
              disabled={!isRecording}
            >
              ⏹️ Stop
            </button>
          </div>
        </div>

        <div className="glass-card chat-input-container">
          <div className="text-input-group">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isOTPVerified ? "Type your message here... (e.g., 'I need a loan of 100000')" : "Please verify OTP to start chatting..."}
              disabled={!isOTPVerified}
            />
            <button
              className="btn btn-primary"
              onClick={sendTextMessage}
              disabled={!isOTPVerified || !textInput.trim()}
              title={!isOTPVerified ? "Please verify OTP first" : ""}
            >
              📤 Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
