// Activities.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Leaf, TreePine, Zap, Car, Wheat, Plus, Filter } from 'lucide-react';

const ACTIVITY_CONFIG = {
  tree_planting:  { label:'Tree Planting', icon: TreePine, color:'#2d9b5a', bg:'rgba(45,155,90,0.1)' },
  solar_energy:   { label:'Solar Energy',  icon: Zap,      color:'#e8a020', bg:'rgba(232,160,32,0.1)' },
  ev_driving:     { label:'EV Driving',    icon: Car,      color:'#1a7fa8', bg:'rgba(26,127,168,0.1)' },
  organic_farming:{ label:'Organic Farm',  icon: Wheat,    color:'#7b4fd4', bg:'rgba(123,79,212,0.1)' },
};
const STATUS_STYLES = {
  pending:          { label:'Pending',    color:'#b87f10', bg:'rgba(232,160,32,0.1)' },
  ai_verified:      { label:'AI Checked', color:'#1a7fa8', bg:'rgba(26,127,168,0.1)' },
  approved:         { label:'Approved',   color:'#2d9b5a', bg:'rgba(45,155,90,0.1)' },
  rejected:         { label:'Rejected',   color:'#e05c3a', bg:'rgba(224,92,58,0.1)' },
  auditor_verified: { label:'Verified',   color:'#2d9b5a', bg:'rgba(45,155,90,0.1)' },
};

export default function Activities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 15 });
        if (filter !== 'all') params.append('type', filter);
        const { data } = await api.get(`/activities/my?${params}`);
        setActivities(data.activities || []);
        setTotal(data.total || 0);
      } catch(e) {}
      setLoading(false);
    })();
  }, [filter, page]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div><h2 style={{ color:'var(--forest)' }}>My Activities</h2><p style={{ color:'var(--fog)' }}>{total} total activities logged</p></div>
        <button onClick={() => navigate('/activities/submit')} style={{ display:'flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#1a6b3c,#2d9b5a)',color:'white',border:'none',borderRadius:12,padding:'11px 20px',fontSize:'0.875rem',fontWeight:600,cursor:'pointer' }}>
          <Plus size={16}/> Log Activity
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['all',...Object.keys(ACTIVITY_CONFIG)].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:99, border:'1.5px solid',
            borderColor: filter===f ? 'var(--canopy)' : 'var(--cloud)',
            background: filter===f ? 'rgba(26,107,60,0.08)' : 'white',
            color: filter===f ? 'var(--canopy)' : 'var(--ash)',
            fontSize:'0.8rem', fontWeight:600, cursor:'pointer'
          }}>
            {f === 'all' ? 'All' : ACTIVITY_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>{[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:72 }}/>)}</div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--fog)' }}>
          <Leaf size={48} style={{ color:'var(--cloud)',marginBottom:12 }}/>
          <h3 style={{ color:'var(--charcoal)' }}>No activities yet</h3>
          <p>Start logging your green actions to earn carbon credits</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {activities.map(a => {
            const cfg = ACTIVITY_CONFIG[a.type] || {};
            const st = STATUS_STYLES[a.verificationStatus] || {};
            const Icon = cfg.icon || Leaf;
            return (
              <div key={a._id} onClick={() => navigate(`/activities/${a._id}`)} style={{
                display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
                background:'white',border:'1px solid var(--cloud)',borderRadius:14,cursor:'pointer',
                transition:'all 0.15s ease'
              }} onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-sm)'}
                 onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{ width:44,height:44,borderRadius:12,background:cfg.bg,color:cfg.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Icon size={20} strokeWidth={2}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.9rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize:'0.75rem',color:'var(--fog)',marginTop:2 }}>{a.quantity} {cfg.label} · {new Date(a.submittedAt).toLocaleDateString('en-IN')}</div>
                </div>
                {a.aiVerification?.analyzed && (
                  <div style={{ textAlign:'center',padding:'0 12px' }}>
                    <div style={{ fontSize:'0.9rem',fontWeight:700,color:'var(--canopy)',fontFamily:'JetBrains Mono' }}>{a.aiVerification.confidence}%</div>
                    <div style={{ fontSize:'0.65rem',color:'var(--fog)' }}>AI conf.</div>
                  </div>
                )}
                <div style={{ textAlign:'right',padding:'0 8px' }}>
                  <div style={{ fontSize:'0.9rem',fontWeight:700,color:'var(--leaf)',fontFamily:'JetBrains Mono' }}>{a.carbonSaved?.toFixed(1)} kg</div>
                  <div style={{ fontSize:'0.65rem',color:'var(--fog)' }}>CO₂ saved</div>
                </div>
                <span style={{ background:st.bg,color:st.color,padding:'4px 10px',borderRadius:99,fontSize:'0.72rem',fontWeight:600,whiteSpace:'nowrap' }}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
      {total > 15 && (
        <div style={{ display:'flex',gap:12,alignItems:'center',justifyContent:'center' }}>
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'8px 16px',borderRadius:10,border:'1.5px solid var(--cloud)',background:'white',cursor:'pointer',fontWeight:600 }}>← Prev</button>
          <span style={{ color:'var(--fog)',fontSize:'0.85rem' }}>Page {page} of {Math.ceil(total/15)}</span>
          <button disabled={page>=Math.ceil(total/15)} onClick={() => setPage(p=>p+1)} style={{ padding:'8px 16px',borderRadius:10,border:'1.5px solid var(--cloud)',background:'white',cursor:'pointer',fontWeight:600 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
