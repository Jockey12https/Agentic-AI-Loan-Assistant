// components/MoodIndicator.tsx - Visual mood indicator for AI responses
'use client';

interface MoodIndicatorProps {
    mood: 'happy' | 'frustrated' | 'anxious' | 'confused' | 'neutral';
}

export default function MoodIndicator({ mood }: MoodIndicatorProps) {
    const moodConfig = {
        happy: {
            emoji: '😊',
            color: '#10b981',
            label: 'Happy & Positive',
            gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
        },
        frustrated: {
            emoji: '😤',
            color: '#ef4444',
            label: 'Frustrated',
            gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
        },
        anxious: {
            emoji: '😰',
            color: '#f59e0b',
            label: 'Anxious',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)'
        },
        confused: {
            emoji: '🤔',
            color: '#8b5cf6',
            label: 'Confused',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #667eea 100%)'
        },
        neutral: {
            emoji: '😐',
            color: '#6b7280',
            label: 'Neutral',
            gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
        }
    };

    const config = moodConfig[mood];

    return (
        <div className="mood-indicator">
            <div className="mood-icon" style={{ background: config.gradient }}>
                <span>{config.emoji}</span>
            </div>
            <div className="mood-label">
                <span className="mood-text">{config.label}</span>
                <div className="mood-pulse" style={{ background: config.color }}></div>
            </div>

            <style jsx>{`
        .mood-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mood-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .mood-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mood-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .mood-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
        </div>
    );
}
