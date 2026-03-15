import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TreePine, Zap, Car, Wheat, TrendingUp, Award, ShieldCheck, Plus, ArrowRight, Leaf } from 'lucide-react';
import './Dashboard.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ACTIVITY_CONFIG = {
  tree_planting:  { label: 'Trees Planted', icon: TreePine, color: '#2d9b5a', bg: 'rgba(45,155,90,0.12)', unit: 'trees' },
  solar_energy:   { label: 'Solar Energy',  icon: Zap,      color: '#e8a020', bg: 'rgba(232,160,32,0.12)', unit: 'kWh' },
  ev_driving:     { label: 'EV Driving',    icon: Car,      color: '#1a7fa8', bg: 'rgba(26,127,168,0.12)', unit: 'km' },
  organic_farming:{ label: 'Organic Farm',  icon: Wheat,    color: '#7b4fd4', bg: 'rgba(123,79,212,0.12)', unit: 'acres' },
};

const STATUS_CONFIG = {
  pending:          { label: 'Pending',   color: '#e8a020', bg: 'rgba(232,160,32,0.1)' },
  ai_verified:      { label: 'AI Checked',color: '#1a7fa8', bg: 'rgba(26,127,168,0.1)' },
  auditor_verified: { label: 'Verified',  color: '#2d9b5a', bg: 'rgba(45,155,90,0.1)' },
  approved:         { label: 'Approved',  color: '#2d9b5a', bg: 'rgba(45,155,90,0.1)' },
  rejected:         { label: 'Rejected',  color: '#e05c3a', bg: 'rgba(224,92,58,0.1)' },
};

function StatCard({ icon: Icon, label, value, sub, color, bg, trend }) {
  return (
    <div className="stat-card animate-fadeIn">
      <div className="stat-icon" style={{ background: bg, color }}><Icon size={22} strokeWidth={2} /></div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
          <TrendingUp size={12} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, platformStats } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, actRes] = await Promise.all([
        api.get('/stats/user/me'),
        api.get('/activities/my?limit=5')
      ]);
      setUserStats(statsRes.data.stats);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = userStats?.monthlyActivity?.map(m => ({
    name: MONTHS[m._id.month - 1],
    activities: m.activities,
    carbon: parseFloat(m.carbonSaved.toFixed(2))
  })) || [];

  const pieData = userStats?.carbonByType?.map(t => ({
    name: ACTIVITY_CONFIG[t._id]?.label || t._id,
    value: parseFloat(t.carbonSaved.toFixed(2)),
    color: ACTIVITY_CONFIG[t._id]?.color || '#2d9b5a'
  })) || [];

  const score = user?.sustainabilityScore || 0;
  const scoreColor = score >= 70 ? '#2d9b5a' : score >= 40 ? '#e8a020' : '#e05c3a';

  if (loading) return (
    <div className="dashboard-loading">
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: i < 4 ? 100 : 200 }} />)}
    </div>
  );

  return (
    <div className="dashboard animate-fadeIn">
      {/* Welcome header */}
      <div className="dash-header">
        <div>
          <h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p style={{ color: 'var(--fog)', marginTop: 4 }}>Here's your climate impact summary · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className="submit-activity-btn" onClick={() => navigate('/activities/submit')}>
          <Plus size={16} /> Log Activity
        </button>
      </div>

      {/* Sustainability Score */}
      <div className="score-banner">
        <div className="score-ring-wrap">
          <svg viewBox="0 0 100 100" className="score-ring">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42 * score / 100} ${2 * Math.PI * 42 * (1 - score / 100)}`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="JetBrains Mono">{score}</text>
            <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Sora">/ 100</text>
          </svg>
        </div>
        <div className="score-info">
          <span className="score-title">Sustainability Score</span>
          <span className="score-desc">
            {score >= 70 ? '🌟 Excellent! You\'re a climate champion.' : score >= 40 ? '🌱 Good progress! Keep going.' : '🌿 Just getting started — log more activities!'}
          </span>
          <div className="score-badges">
            {user?.treesPlanted > 0 && <span className="s-badge">🌳 {user.treesPlanted} trees</span>}
            {user?.solarKwh > 0 && <span className="s-badge">⚡ {user.solarKwh} kWh</span>}
            {user?.evKmDriven > 0 && <span className="s-badge">🚗 {user.evKmDriven} km</span>}
          </div>
        </div>
        <div className="score-carbon">
          <div className="carbon-big">
            <span className="carbon-val">{(user?.totalCarbonSaved || 0).toFixed(1)}</span>
            <span className="carbon-unit">kg CO₂</span>
          </div>
          <span className="carbon-lbl">Total Saved</span>
        </div>
        <div className="score-credits">
          <div className="credits-big">
            <span className="credits-val">{(user?.carbonCredits || 0).toFixed(4)}</span>
          </div>
          <span className="credits-lbl">Carbon Credits</span>
          <button className="credits-sell-btn" onClick={() => navigate('/marketplace')}>Sell →</button>
        </div>
      </div>

      {/* Platform stats */}
      {platformStats && (
        <div className="platform-strip">
          <span className="platform-label">🌍 Kerala Impact</span>
          <div className="platform-stats">
            <span><strong>{(platformStats.totalCarbonSaved / 1000).toFixed(1)}t</strong> CO₂ Saved</span>
            <span><strong>{platformStats.totalUsers}</strong> Champions</span>
            <span><strong>{platformStats.approvedActivities}</strong> Verified Acts</span>
            <span><strong>{platformStats.totalCredits?.toFixed(2)}</strong> Credits Issued</span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard icon={Leaf}  label="Total Activities" value={user?.totalActivities || 0} color="#2d9b5a" bg="rgba(45,155,90,0.1)" />
        <StatCard icon={TreePine} label="Trees Planted" value={user?.treesPlanted || 0} sub="≈ 22kg CO₂/yr each" color="#1a6b3c" bg="rgba(26,107,60,0.1)" />
        <StatCard icon={Zap}   label="Solar Generated" value={`${user?.solarKwh || 0} kWh`} sub="0.85kg saved/kWh" color="#e8a020" bg="rgba(232,160,32,0.1)" />
        <StatCard icon={Car}   label="EV Distance" value={`${user?.evKmDriven || 0} km`} sub="0.12kg saved/km" color="#1a7fa8" bg="rgba(26,127,168,0.1)" />
      </div>

      {/* Charts section */}
      <div className="charts-grid">
        {/* Activity trend */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Carbon Saved Over Time</h4>
            <span className="chart-badge">Monthly</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2d9b5a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d9b5a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cloud)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--fog)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--fog)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cloud)', fontSize: 12 }} />
                <Area type="monotone" dataKey="carbon" stroke="#2d9b5a" strokeWidth={2} fill="url(#carbonGrad)" name="CO₂ Saved (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <Leaf size={32} style={{ color: 'var(--cloud)' }} />
              <p>No data yet — log your first activity!</p>
            </div>
          )}
        </div>

        {/* Activity breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Impact by Activity</h4>
            <span className="chart-badge">CO₂ kg</span>
          </div>
          {pieData.length > 0 ? (
            <div className="pie-wrap">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cloud)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-label">{d.name}</span>
                    <span className="legend-val">{d.value} kg</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">
              <Award size={32} style={{ color: 'var(--cloud)' }} />
              <p>Submit activities to see breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform district chart */}
      {platformStats?.districtStats?.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h4>Kerala Carbon Leaders by District</h4>
            <span className="chart-badge">Platform-wide</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformStats.districtStats.slice(0, 10).map(d => ({ name: d._id, carbon: parseFloat(d.carbonSaved.toFixed(0)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cloud)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--fog)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--fog)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cloud)', fontSize: 12 }} />
              <Bar dataKey="carbon" name="CO₂ Saved (kg)" fill="#2d9b5a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activities */}
      <div className="recent-section">
        <div className="section-header">
          <h4>Recent Activities</h4>
          <button className="see-all-btn" onClick={() => navigate('/activities')}>
            See all <ArrowRight size={14} />
          </button>
        </div>
        {activities.length === 0 ? (
          <div className="empty-state">
            <Leaf size={40} style={{ color: 'var(--cloud)' }} />
            <h4>No activities yet</h4>
            <p>Start by logging your first green activity to earn carbon credits</p>
            <button className="submit-activity-btn" onClick={() => navigate('/activities/submit')}>
              <Plus size={16} /> Log First Activity
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {activities.map(a => {
              const cfg = ACTIVITY_CONFIG[a.type] || {};
              const st = STATUS_CONFIG[a.verificationStatus] || {};
              const Icon = cfg.icon || Leaf;
              return (
                <div key={a._id} className="activity-row" onClick={() => navigate(`/activities/${a._id}`)}>
                  <div className="act-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="act-info">
                    <span className="act-title">{a.title}</span>
                    <span className="act-meta">{a.quantity} {cfg.unit} · {new Date(a.submittedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="act-carbon">
                    <span className="act-saved">{a.carbonSaved?.toFixed(1)} kg</span>
                    <span className="act-saved-lbl">CO₂ saved</span>
                  </div>
                  <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auditor panel shortcut */}
      {(user?.role === 'auditor' && user?.auditorApproved) && (
        <div className="auditor-banner">
          <ShieldCheck size={24} style={{ color: '#1a7fa8' }} />
          <div>
            <strong>You are an approved Auditor</strong>
            <p style={{ margin: 0 }}>Review pending activities and help verify carbon claims.</p>
          </div>
          <button className="cta-small" onClick={() => navigate('/auditor')}>Open Auditor Panel →</button>
        </div>
      )}
    </div>
  );
}
