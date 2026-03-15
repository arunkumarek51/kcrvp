import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreePine, Zap, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const DEMO_ACCOUNTS = [
  { label: 'Admin',   email: 'admin@kcrvp.in',   password: 'admin123',   color: '#e05c3a' },
  { label: 'Auditor', email: 'auditor@kcrvp.in',  password: 'auditor123', color: '#1a7fa8' },
  { label: 'Farmer',  email: 'farmer@kcrvp.in',   password: 'farmer123',  color: '#e8a020' },
  { label: 'Citizen', email: 'citizen@kcrvp.in',  password: 'citizen123', color: '#2d9b5a' },
  { label: 'Company', email: 'company@kcrvp.in',  password: 'company123', color: '#7b4fd4' },
];

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🌿`);
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (account) => {
    setLoading(true);
    try {
      const user = await login(account.email, account.password);
      toast.success(`Logged in as ${account.label} 🌿`);
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Demo login failed — make sure backend is running and seeded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="hero-content">
          <div className="hero-logo">
            <TreePine size={40} />
            <Zap size={18} className="hero-zap" />
          </div>
          <h1>KCRVP</h1>
          <p className="hero-tagline">Kerala Carbon Registry & Verification Platform</p>
          <p className="hero-desc">Track green activities, earn verified carbon credits, and build a sustainable Kerala.</p>
          <div className="hero-stats">
            {[
              { label: 'Trees Planted', value: '12,540+' },
              { label: 'CO₂ Saved', value: '275 t' },
              { label: 'Credits Issued', value: '0.27+' },
            ].map(s => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-val">{s.value}</span>
                <span className="hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-badges">
            {['🌱 Tree Planting', '☀️ Solar Energy', '🚗 EV Driving', '🌾 Organic Farming'].map(b => (
              <span key={b} className="hero-badge">{b}</span>
            ))}
          </div>
        </div>
        <div className="hero-bg-rings">
          {[1,2,3].map(i => <div key={i} className={`ring ring-${i}`} />)}
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-header">
            <h2>Sign in</h2>
            <p>Continue your climate journey</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label>Email address</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="field-group">
              <label>Password</label>
              <div className="input-with-icon">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div className="auth-divider"><span>Quick Demo Login</span></div>

          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.label} className="demo-btn" style={{ '--role-color': acc.color }} onClick={() => quickLogin(acc)} disabled={loading}>
                <span className="demo-dot" />
                {acc.label}
              </button>
            ))}
          </div>

          <p className="auth-footer-text">
            New to KCRVP? <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
