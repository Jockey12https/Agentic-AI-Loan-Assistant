// components/LoanCalculator.tsx - Interactive loan calculator with EMI display
'use client';

import { useState, useEffect } from 'react';

interface LoanCalculatorProps {
    maxAmount?: number;
    onCalculate?: (amount: number, tenure: number, emi: number) => void;
}

export default function LoanCalculator({ maxAmount = 250000, onCalculate }: LoanCalculatorProps) {
    const [amount, setAmount] = useState(100000);
    const [tenure, setTenure] = useState(36);
    const [interestRate] = useState(12);
    const [emi, setEmi] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);

    useEffect(() => {
        calculateEMI();
    }, [amount, tenure]);

    const calculateEMI = () => {
        const r = interestRate / 100 / 12;
        const calculatedEMI = amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1);
        const total = calculatedEMI * tenure;
        const interest = total - amount;

        setEmi(Math.round(calculatedEMI));
        setTotalPayment(Math.round(total));
        setTotalInterest(Math.round(interest));

        if (onCalculate) {
            onCalculate(amount, tenure, Math.round(calculatedEMI));
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const tenureOptions = [12, 24, 36, 48, 60];

    return (
        <div className="loan-calculator">
            <h3 className="calculator-title">💰 Loan Calculator</h3>

            <div className="calculator-section">
                <label className="calculator-label">
                    <span>Loan Amount</span>
                    <span className="amount-display">{formatCurrency(amount)}</span>
                </label>
                <input
                    type="range"
                    min="10000"
                    max={maxAmount}
                    step="10000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="amount-slider"
                />
                <div className="slider-labels">
                    <span>{formatCurrency(10000)}</span>
                    <span>{formatCurrency(maxAmount)}</span>
                </div>
            </div>

            <div className="calculator-section">
                <label className="calculator-label">
                    <span>Tenure</span>
                    <span className="tenure-display">{tenure} months</span>
                </label>
                <div className="tenure-options">
                    {tenureOptions.map((option) => (
                        <button
                            key={option}
                            className={`tenure-btn ${tenure === option ? 'active' : ''}`}
                            onClick={() => setTenure(option)}
                        >
                            {option}m
                        </button>
                    ))}
                </div>
            </div>

            <div className="emi-display">
                <div className="emi-label">Monthly EMI</div>
                <div className="emi-value">{formatCurrency(emi)}</div>
                <div className="emi-subtitle">@ {interestRate}% p.a.</div>
            </div>

            <div className="breakdown">
                <div className="breakdown-item">
                    <span className="breakdown-label">Principal Amount</span>
                    <span className="breakdown-value">{formatCurrency(amount)}</span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">Total Interest</span>
                    <span className="breakdown-value interest">{formatCurrency(totalInterest)}</span>
                </div>
                <div className="breakdown-item total">
                    <span className="breakdown-label">Total Payment</span>
                    <span className="breakdown-value">{formatCurrency(totalPayment)}</span>
                </div>
            </div>

            <div className="breakdown-chart">
                <div
                    className="chart-principal"
                    style={{ width: `${(amount / totalPayment) * 100}%` }}
                >
                    <span className="chart-label">Principal</span>
                </div>
                <div
                    className="chart-interest"
                    style={{ width: `${(totalInterest / totalPayment) * 100}%` }}
                >
                    <span className="chart-label">Interest</span>
                </div>
            </div>

            <style jsx>{`
        .loan-calculator {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .calculator-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .calculator-section {
          margin-bottom: 1.5rem;
        }

        .calculator-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .amount-display, .tenure-display {
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
        }

        .amount-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          outline: none;
          -webkit-appearance: none;
        }

        .amount-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .tenure-options {
          display: flex;
          gap: 0.5rem;
        }

        .tenure-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tenure-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .tenure-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: #fff;
        }

        .emi-display {
          text-align: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .emi-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .emi-value {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .emi-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.5rem;
        }

        .breakdown {
          margin: 1.5rem 0;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .breakdown-item.total {
          border-bottom: none;
          font-weight: 700;
          font-size: 1.125rem;
          margin-top: 0.5rem;
        }

        .breakdown-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .breakdown-value {
          color: #fff;
        }

        .breakdown-value.interest {
          color: #f59e0b;
        }

        .breakdown-chart {
          display: flex;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 1rem;
        }

        .chart-principal, .chart-interest {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          transition: width 0.3s ease;
        }

        .chart-principal {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .chart-interest {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        }

        .chart-label {
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
        </div>
    );
}
