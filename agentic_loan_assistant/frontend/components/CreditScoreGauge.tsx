// components/CreditScoreGauge.tsx - Credit score visualization component
'use client';

import { useEffect, useState } from 'react';

interface CreditScoreGaugeProps {
    score: number;
    maxScore?: number;
}

export default function CreditScoreGauge({ score, maxScore = 900 }: CreditScoreGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        // Animate score on mount
        const duration = 1500;
        const steps = 60;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [score]);

    const percentage = (score / maxScore) * 100;
    const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees

    const getScoreCategory = (score: number) => {
        if (score >= 800) return { label: 'Excellent', color: '#10b981', emoji: '🌟' };
        if (score >= 750) return { label: 'Very Good', color: '#3b82f6', emoji: '⭐' };
        if (score >= 700) return { label: 'Good', color: '#8b5cf6', emoji: '👍' };
        if (score >= 650) return { label: 'Fair', color: '#f59e0b', emoji: '⚠️' };
        return { label: 'Poor', color: '#ef4444', emoji: '❌' };
    };

    const category = getScoreCategory(score);

    return (
        <div className="credit-score-gauge">
            <div className="gauge-container">
                <svg viewBox="0 0 200 120" className="gauge-svg">
                    {/* Background arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Colored segments */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 52 42"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />
                    <path
                        d="M 52 42 A 80 80 0 0 1 100 20"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />
                    <path
                        d="M 100 20 A 80 80 0 0 1 148 42"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />
                    <path
                        d="M 148 42 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />

                    {/* Progress arc */}
                    <path
                        d={`M 20 100 A 80 80 0 ${percentage > 50 ? 1 : 0} 1 ${100 + 80 * Math.cos((rotation * Math.PI) / 180)
                            } ${100 + 80 * Math.sin((rotation * Math.PI) / 180)}`}
                        fill="none"
                        stroke={category.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="gauge-progress"
                    />

                    {/* Needle */}
                    <g transform={`rotate(${rotation} 100 100)`}>
                        <line
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="30"
                            stroke={category.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle cx="100" cy="100" r="6" fill={category.color} />
                    </g>
                </svg>

                <div className="gauge-score">
                    <div className="score-value">{animatedScore}</div>
                    <div className="score-max">/ {maxScore}</div>
                </div>
            </div>

            <div className="gauge-label">
                <span className="category-emoji">{category.emoji}</span>
                <span className="category-label" style={{ color: category.color }}>
                    {category.label}
                </span>
            </div>

            <style jsx>{`
        .credit-score-gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .gauge-container {
          position: relative;
          width: 200px;
          height: 120px;
        }
        
        .gauge-svg {
          width: 100%;
          height: 100%;
        }
        
        .gauge-progress {
          filter: drop-shadow(0 0 8px currentColor);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .gauge-score {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
        
        .score-value {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        
        .score-max {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.25rem;
        }
        
        .gauge-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .category-emoji {
          font-size: 1.5rem;
        }
      `}</style>
        </div>
    );
}
