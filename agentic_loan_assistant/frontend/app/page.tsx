'use client';

import { useState, useRef, useEffect } from 'react';
import CreditScoreGauge from '../components/CreditScoreGauge';
import LoanCalculator from '../components/LoanCalculator';
import MoodIndicator from '../components/MoodIndicator';
import VoiceAuth from '../components/VoiceAuth';

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
  const [currentMood, setCurrentMood] = useState<'happy' | 'frustrated' | 'anxious' | 'confused' | 'neutral'>('neutral');
  const chatLogRef = useRef<HTMLDivElement>(null);

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
    };

    // Detect amount in text
    const amountMatch = text.match(/(\d+(,\d{3})*(\.\d+)?)/);
    if (amountMatch) {
      payload.requested_amount = parseInt(amountMatch[0].replace(/,/g, ''));
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
        });
      }

      setError(null);
    } catch (e: any) {
      setIsTyping(false);
      addMessage('error', `Network error: ${e.toString()}`);
      setError('Failed to connect to backend. Make sure the server is running on http://localhost:8000');
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
              placeholder="Enter customer ID (e.g., cust004)"
            />
          </div>
        </div>

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
            {showVoiceAuth ? '🔐 Hide Voice Auth' : '🔐 Setup Voice Authentication'}
          </button>
        </div>

        {showVoiceAuth && (
          <div className="glass-card">
            <VoiceAuth />
          </div>
        )}

        <div className="glass-card">
          <div className="controls">
            <button
              className="btn btn-primary"
              onClick={startRecording}
              disabled={isRecording || !recognition}
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

        <div className="glass-card">
          <div className="text-input-group">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (e.g., 'I need a loan of 100000')"
            />
            <button
              className="btn btn-primary"
              onClick={sendTextMessage}
              disabled={!textInput.trim()}
            >
              📤 Send
            </button>
          </div>
        </div>

        <div className="chat-log" ref={chatLogRef}>
          {messages.length === 0 ? (
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
      </div>
    </div>
  );
}
