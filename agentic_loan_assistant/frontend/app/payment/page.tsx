// app/payment/page.tsx - Payment management page
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Link from 'next/link';

interface UserData {
    name: string;
    email: string;
    customerId: string;
    currentLoanAmount?: number;
    totalLoanAmount?: number;
    monthlyEMI?: number;
    loanStatus?: string;
    nextPaymentDate?: string;
    tenure?: number;
}

interface PaymentHistory {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    method: string;
}

export default function PaymentPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [processing, setProcessing] = useState(false);

    // Mock payment history - in production, fetch from backend
    const [paymentHistory] = useState<PaymentHistory[]>([
        { id: '1', date: '2024-11-06', amount: 5420, status: 'paid', method: 'UPI' },
        { id: '2', date: '2024-10-06', amount: 5420, status: 'paid', method: 'Net Banking' },
        { id: '3', date: '2024-09-06', amount: 5420, status: 'paid', method: 'UPI' },
    ]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        loadUserData();
    }, [user, authLoading, router]);

    const loadUserData = async () => {
        if (!user || !db) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            alert('✅ Payment successful! Your EMI has been paid.');
            setShowPaymentModal(false);
            setProcessing(false);
        }, 2000);
    };

    const getNextPaymentDate = () => {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 6);
        return nextMonth.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (authLoading) {
        return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
    }

    return (
        <div className="payment-page">
            <header className="page-header">
                <div className="header-content">
                    <Link href="/dashboard" className="back-btn">← Back to Dashboard</Link>
                    <h1>💰 Payment Management</h1>
                    <p>Manage your loan EMI payments</p>
                </div>
            </header>

            <div className="payment-content">
                {/* Current EMI Card */}
                <div className="emi-card">
                    <div className="emi-header">
                        <h2>Next EMI Payment</h2>
                        <span className="due-badge">Due: {getNextPaymentDate()}</span>
                    </div>
                    <div className="emi-amount">
                        <span className="currency">₹</span>
                        <span className="amount">{userData?.monthlyEMI ? userData.monthlyEMI.toLocaleString('en-IN') : '0'}</span>
                    </div>
                    <div className="emi-details">
                        <div className="detail-item">
                            <span>Outstanding Loan</span>
                            <span className="value">₹{userData?.currentLoanAmount ? userData.currentLoanAmount.toLocaleString('en-IN') : '0'}</span>
                        </div>
                        <div className="detail-item">
                            <span>Customer ID</span>
                            <span className="value">{userData?.customerId}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowPaymentModal(true)} className="btn-pay-now">
                        Pay Now
                    </button>
                </div>

                {/* Payment Methods */}
                <div className="glass-card">
                    <h2>Payment Methods</h2>
                    <div className="payment-methods">
                        <div className="method-card">
                            <div className="method-icon">📱</div>
                            <h3>UPI</h3>
                            <p>Google Pay, PhonePe, Paytm</p>
                        </div>
                        <div className="method-card">
                            <div className="method-icon">💳</div>
                            <h3>Debit/Credit Card</h3>
                            <p>Visa, Mastercard, RuPay</p>
                        </div>
                        <div className="method-card">
                            <div className="method-icon">🏦</div>
                            <h3>Net Banking</h3>
                            <p>All major banks</p>
                        </div>
                        <div className="method-card">
                            <div className="method-icon">🔄</div>
                            <h3>Auto-Debit</h3>
                            <p>Set up auto-pay</p>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="glass-card">
                    <h2>Payment History</h2>
                    <div className="payment-history">
                        {paymentHistory.length > 0 ? (
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                                            <td>₹{payment.amount.toLocaleString('en-IN')}</td>
                                            <td>{payment.method}</td>
                                            <td>
                                                <span className={`status-badge status-${payment.status}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-history">No payment history available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => !processing && setShowPaymentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Complete Payment</h2>
                        <div className="payment-summary">
                            <div className="summary-row">
                                <span>EMI Amount</span>
                                <span className="amount">₹{userData?.monthlyEMI ? userData.monthlyEMI.toLocaleString('en-IN') : '0'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Processing Fee</span>
                                <span className="amount">₹0</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span className="amount">₹{userData?.monthlyEMI ? userData.monthlyEMI.toLocaleString('en-IN') : '0'}</span>
                            </div>
                        </div>

                        <div className="payment-method-select">
                            <label>Select Payment Method</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="upi">UPI</option>
                                <option value="card">Debit/Credit Card</option>
                                <option value="netbanking">Net Banking</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button onClick={handlePayment} disabled={processing} className="btn-confirm">
                                {processing ? 'Processing...' : 'Confirm Payment'}
                            </button>
                            <button onClick={() => setShowPaymentModal(false)} disabled={processing} className="btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .payment-page { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .page-header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .header-content { max-width: 1200px; margin: 0 auto; }
        .back-btn { display: inline-block; color: white; text-decoration: none; margin-bottom: 1rem; font-weight: 600; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border-radius: 8px; transition: all 0.3s; }
        .back-btn:hover { background: rgba(255,255,255,0.3); }
        .page-header h1 { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
        .page-header p { color: rgba(255,255,255,0.8); }
        .payment-content { max-width: 1200px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        
        .emi-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; padding: 2rem; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .emi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .emi-header h2 { font-size: 1.5rem; font-weight: 700; }
        .due-badge { background: rgba(255,255,255,0.3); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; }
        .emi-amount { text-align: center; margin: 2rem 0; }
        .emi-amount .currency { font-size: 2rem; opacity: 0.8; }
        .emi-amount .amount { font-size: 4rem; font-weight: 700; margin-left: 0.5rem; }
        .emi-details { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .detail-item { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .detail-item .value { font-weight: 700; }
        .btn-pay-now { width: 100%; padding: 1rem; background: white; color: #f5576c; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .btn-pay-now:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        
        .glass-card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .glass-card h2 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin-bottom: 1.5rem; }
        
        .payment-methods { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .method-card { text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; transition: all 0.3s; cursor: pointer; }
        .method-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(102,126,234,0.3); }
        .method-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .method-card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem; }
        .method-card p { font-size: 0.875rem; opacity: 0.9; }
        
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th { text-align: left; padding: 0.75rem; background: #f7fafc; color: #4a5568; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .history-table td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; }
        .status-badge { padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #c6f6d5; color: #22543d; }
        .status-pending { background: #fef5e7; color: #975a16; }
        .status-failed { background: #fed7d7; color: #742a2a; }
        .no-history { text-align: center; color: #718096; padding: 2rem; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; }
        .modal-content h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a202c; }
        .payment-summary { background: #f7fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.75rem 0; }
        .summary-row.total { border-top: 2px solid #e2e8f0; margin-top: 0.5rem; padding-top: 1rem; font-weight: 700; font-size: 1.125rem; }
        .payment-method-select { margin-bottom: 1.5rem; }
        .payment-method-select label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; }
        .payment-method-select select { width: 100%; padding: 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
        .modal-actions { display: flex; gap: 1rem; }
        .btn-confirm { flex: 1; padding: 0.875rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { flex: 1; padding: 0.875rem; background: #e2e8f0; color: #4a5568; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .loading-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .payment-methods { grid-template-columns: 1fr; }
          .modal-actions { flex-direction: column; }
          .emi-amount .amount { font-size: 3rem; }
        }
      `}</style>
        </div>
    );
}
