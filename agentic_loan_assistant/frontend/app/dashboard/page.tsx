// app/dashboard/page.tsx - Optimized dashboard with KYC feature
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import CreditScoreGauge from '../../components/CreditScoreGauge';
import Link from 'next/link';

interface UserData {
  name: string;
  email: string;
  customerId: string;
  kycStatus: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  aadharNumber?: string;
  currentLoanAmount?: number;
  totalLoanAmount?: number;
  monthlyEMI?: number;
  loanStatus?: string;
  sanctionLetterUrl?: string;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [kycData, setKycData] = useState({ phone: '', address: '', panNumber: '', aadharNumber: '' });
  const [loading, setLoading] = useState(false);

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

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update user document in Firestore
      const updatedData = {
        name: userData?.name || '',
        email: userData?.email || '',
        customerId: userData?.customerId || '',
        phone: kycData.phone,
        address: kycData.address,
        panNumber: kycData.panNumber,
        aadharNumber: kycData.aadharNumber,
        kycStatus: 'completed',
        kycCompletedAt: new Date().toISOString(),
      };

      await setDoc(doc(db!, 'users', user!.uid), updatedData, { merge: true });

      // Reload user data to reflect changes
      await loadUserData();
      setShowKYCForm(false);
      alert('✅ KYC completed successfully! Your details have been saved.');
    } catch (error) {
      console.error('KYC submission error:', error);
      alert('❌ Error completing KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome, {userData?.name || 'User'}! 👋</h1>
            <p>Manage your loans and financial journey</p>
          </div>
          <button onClick={() => { logout(); router.push('/login'); }} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* KYC Section - Always Visible */}
        {!showKYCForm && (
          <div className={`kyc-alert ${userData?.kycStatus === 'completed' ? 'kyc-completed' : ''}`}>
            <h3>{userData?.kycStatus === 'completed' ? '✅ KYC Completed' : '⚠️ Complete Your KYC'}</h3>
            <p>{userData?.kycStatus === 'completed' ? 'Your KYC is verified' : 'Complete your KYC to access all loan features'}</p>
            <button onClick={() => setShowKYCForm(true)} className="btn-primary">
              {userData?.kycStatus === 'completed' ? 'Update KYC Details' : 'Complete KYC Now'}
            </button>
          </div>
        )}

        {/* KYC Form */}
        {showKYCForm && (
          <div className="glass-card">
            <h2>Complete KYC</h2>
            <form onSubmit={handleKYCSubmit} className="kyc-form">
              <input type="tel" placeholder="Phone Number" value={kycData.phone} onChange={(e) => setKycData({ ...kycData, phone: e.target.value })} required />
              <textarea placeholder="Address" value={kycData.address} onChange={(e) => setKycData({ ...kycData, address: e.target.value })} required />
              <input type="text" placeholder="PAN Number" value={kycData.panNumber} onChange={(e) => setKycData({ ...kycData, panNumber: e.target.value })} required />
              <input type="text" placeholder="Aadhar Number" value={kycData.aadharNumber} onChange={(e) => setKycData({ ...kycData, aadharNumber: e.target.value })} required />
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit KYC'}</button>
                <button type="button" onClick={() => setShowKYCForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">💰</div><div><p>Current Loan</p><h3>₹{userData?.currentLoanAmount ? userData.currentLoanAmount.toLocaleString('en-IN') : '0'}</h3></div></div>
          <div className="stat-card"><div className="stat-icon">📊</div><div><p>Total Loans</p><h3>₹{userData?.totalLoanAmount ? userData.totalLoanAmount.toLocaleString('en-IN') : '0'}</h3></div></div>
          <div className="stat-card"><div className="stat-icon">💳</div><div><p>Monthly EMI</p><h3>₹{userData?.monthlyEMI ? userData.monthlyEMI.toLocaleString('en-IN') : '0'}</h3></div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div><p>KYC Status</p><h3>{userData?.kycStatus || 'Pending'}</h3></div></div>
        </div>

        {/* Credit Score & Actions */}
        <div className="main-grid">
          <div className="glass-card">
            <h2>Credit Score</h2>
            <CreditScoreGauge score={750} />
            <p className="credit-tip">💡 Maintain above 750 for better offers</p>
          </div>
          <div className="glass-card">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <button onClick={() => router.push(`/?customerId=${userData?.customerId || ''}`)} className="action-btn"><span>💬</span><span>Apply Loan</span></button>
              {userData?.sanctionLetterUrl && (
                <button onClick={() => window.open(`http://localhost:8000${userData.sanctionLetterUrl}`, '_blank')} className="action-btn"><span>📜</span><span>Sanction Letter</span></button>
              )}
              <button className="action-btn"><span>💰</span><span>Payment</span></button>
              <button className="action-btn"><span>📞</span><span>Support</span></button>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="glass-card">
          <h2>Profile</h2>
          <div className="profile-info">
            <div className="info-row"><span>Name:</span><span>{userData?.name}</span></div>
            <div className="info-row"><span>Email:</span><span>{userData?.email}</span></div>
            <div className="info-row"><span>Phone:</span><span>{userData?.phone || 'Not provided'}</span></div>
            <div className="info-row"><span>Customer ID:</span><span>{userData?.customerId}</span></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .dashboard-header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .dashboard-header h1 { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
        .dashboard-header p { color: rgba(255,255,255,0.8); }
        .btn-logout { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-logout:hover { background: rgba(255,255,255,0.3); }
        .dashboard-content { max-width: 1200px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .kyc-alert { background: rgba(255,193,7,0.9); padding: 2rem; border-radius: 16px; text-align: center; }
        .kyc-alert.kyc-completed { background: rgba(76,175,80,0.9); }
        .kyc-alert h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .kyc-form { display: flex; flex-direction: column; gap: 1rem; }
        .kyc-form input, .kyc-form textarea { padding: 0.875rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
        .kyc-form textarea { min-height: 100px; }
        .form-actions { display: flex; gap: 1rem; }
        .btn-primary { padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-secondary { padding: 0.875rem 1.5rem; background: rgba(255,255,255,0.1); color: #333; border: 1px solid #ddd; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .stat-card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .stat-icon { font-size: 2.5rem; }
        .stat-card p { font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem; }
        .stat-card h3 { font-size: 1.75rem; font-weight: 700; color: #1a202c; }
        .main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .glass-card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .glass-card h2 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin-bottom: 1.5rem; }
        .credit-tip { text-align: center; margin-top: 1rem; color: #718096; font-size: 0.875rem; }
        .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .action-btn { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; cursor: pointer; text-decoration: none; transition: all 0.3s ease; }
        .action-btn:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(102,126,234,0.3); }
        .action-btn span:first-child { font-size: 2rem; }
        .profile-info { display: flex; flex-direction: column; gap: 1rem; }
        .info-row { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0; }
        .info-row span:first-child { font-weight: 600; color: #4a5568; }
        .info-row span:last-child { color: #1a202c; }
        .loading-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .header-content { flex-direction: column; gap: 1rem; text-align: center; }
          .stats-grid, .main-grid, .actions-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
