import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreePine, Zap, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const ROLES = [
  { value: 'citizen', icon: '🧑', name: 'Citizen', desc: 'EV, solar, trees' },
  { value: 'farmer',  icon: '🌾', name: 'Farmer',  desc: 'Organic farming' },
  { value: 'auditor', icon: '🔍', name: 'Auditor', desc: 'Verify activities' },
  { value: 'company', icon: '🏢', name: 'Company', desc: 'Buy carbon credits' },
];

const DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam',
  'Idukki','Ernakulam','Thrissur','Palakkad','Malappuram',
  'Kozhikode','Wayanad','Kannur','Kasaragod'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'citizen', district:'', phone:'', companyName:'', agree:false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill required fields');
    if (!form.agree) return toast.error('Please accept the terms');
    if (form.password.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to KCRVP, ${user.name.split(' ')[0]}! 🌿`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1>Join KCRVP</h1>
          <p className="hero-tagline">Kerala Carbon Registry</p>
          <p className="hero-desc">Be part of Kerala's green revolution. Track, verify, and monetize your sustainable actions.</p>
          <div className="hero-badges">
            {['🏆 Earn Credits','🌍 Fight Climate Change','💰 Sell on Marketplace','📍 GPS Verified'].map(b => (
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
            <h2>Create Account</h2>
            <p>Start your green journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label>I am a…</label>
              <div className="roles-grid">
                {ROLES.map(r => (
                  <div key={r.value} className={`role-option ${form.role === r.value ? 'selected' : ''}`} onClick={() => set('role', r.value)}>
                    <span className="role-icon">{r.icon}</span>
                    <span className="role-name">{r.name}</span>
                    <span className="role-desc">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label>Full Name *</label>
              <input placeholder="Rajan Pillai" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="field-group">
              <label>Email *</label>
              <input type="email" placeholder="rajan@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="field-group">
              <label>Password *</label>
              <div className="input-with-icon">
                <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" className="toggle-pw" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field-group">
                <label>District</label>
                <select value={form.district} onChange={e => set('district', e.target.value)}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label>Phone</label>
                <input placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            {form.role === 'company' && (
              <div className="field-group">
                <label>Company Name</label>
                <input placeholder="Kerala Green Solutions Ltd" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            )}

            <div className="checkbox-group">
              <input type="checkbox" id="agree" checked={form.agree} onChange={e => set('agree', e.target.checked)} />
              <label htmlFor="agree">I agree to KCRVP's <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
