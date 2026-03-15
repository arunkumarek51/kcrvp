import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { ShieldCheck, Check, X, Clock, TreePine, Zap, Car, Wheat, Loader, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIVITY_CONFIG = {
  tree_planting:  { label:'Tree Planting', icon: TreePine, color:'#2d9b5a', bg:'rgba(45,155,90,0.1)' },
  solar_energy:   { label:'Solar Energy',  icon: Zap,      color:'#e8a020', bg:'rgba(232,160,32,0.1)' },
  ev_driving:     { label:'EV Driving',    icon: Car,      color:'#1a7fa8', bg:'rgba(26,127,168,0.1)' },
  organic_farming:{ label:'Organic Farm',  icon: Wheat,    color:'#7b4fd4', bg:'rgba(123,79,212,0.1)' },
};

export default function AuditorPanel() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState(null); // 'approve' | 'reject'

  const fetchData = async () => {
    try {
      const [actRes, statsRes] = await Promise.all([
        api.get('/auditor/pending?limit=30'),
        api.get('/auditor/stats')
      ]);
      setActivities(actRes.data.activities || []);
      setStats(statsRes.data.stats || {});
    } catch(e) { toast.error('Failed to load activities'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async () => {
    if (!selected || !decision) return;
    setProcessing(selected._id);
    try {
      const { data } = await api.put(`/auditor/verify/${selected._id}`, { decision, note });
      toast.success(decision === 'approve'
        ? `✅ Approved! ${data.creditsIssued?.toFixed(4) || 0} carbon credits issued.`
        : '❌ Activity rejected.');
      setSelected(null);
      setNote('');
      setDecision(null);
      fetchData();
    } catch(err) { toast.error(err.response?.data?.message || 'Verification failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:24 }} className="animate-fadeIn">
      <div style={{ display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap' }}>
        <div>
          <h2 style={{ color:'var(--forest)' }}>Auditor Panel</h2>
          <p style={{ color:'var(--fog)' }}>Review and verify submitted green activities</p>
        </div>
        <div style={{ marginLeft:'auto',display:'flex',gap:12,flexWrap:'wrap' }}>
          {[
            { label:'Pending',  val:stats.pending||0,  color:'#e8a020', bg:'rgba(232,160,32,0.1)' },
            { label:'Approved', val:stats.approved||0, color:'var(--leaf)', bg:'rgba(45,155,90,0.1)' },
            { label:'Rejected', val:stats.rejected||0, color:'#e05c3a', bg:'rgba(224,92,58,0.1)' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg,borderRadius:12,padding:'10px 16px',textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem',fontWeight:800,color:s.color,fontFamily:'JetBrains Mono' }}>{s.val}</div>
              <div style={{ fontSize:'0.68rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 380px',gap:20,alignItems:'start' }}>
        {/* Activity list */}
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {loading ? (
            [...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:90 }}/>)
          ) : activities.length === 0 ? (
            <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'60px 24px',textAlign:'center',color:'var(--fog)' }}>
              <ShieldCheck size={40} style={{ color:'var(--cloud)',marginBottom:12 }}/>
              <h4 style={{ color:'var(--charcoal)' }}>All caught up!</h4>
              <p>No activities pending review.</p>
            </div>
          ) : activities.map(a => {
            const cfg = ACTIVITY_CONFIG[a.type] || {};
            const Icon = cfg.icon || ShieldCheck;
            const isSelected = selected?._id === a._id;
            return (
              <div key={a._id} onClick={() => { setSelected(isSelected?null:a); setNote(''); setDecision(null); }}
                style={{
                  background:'white',border:`2px solid ${isSelected?'var(--canopy)':'var(--cloud)'}`,
                  borderRadius:14,padding:'16px 18px',cursor:'pointer',transition:'all 0.15s ease',
                  boxShadow:isSelected?'var(--shadow-md)':'none'
                }}>
                <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:cfg.bg,color:cfg.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Icon size={20} strokeWidth={2}/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.9rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize:'0.75rem',color:'var(--fog)',marginTop:2 }}>
                      {a.user?.name} · {a.user?.district||'Kerala'} · {a.quantity} {cfg.label}
                    </div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontSize:'1rem',fontWeight:700,color:'var(--leaf)',fontFamily:'JetBrains Mono' }}>{a.carbonSaved?.toFixed(1)} kg</div>
                    <div style={{ display:'flex',gap:6,marginTop:4,justifyContent:'flex-end' }}>
                      {a.photos?.length>0 && <span style={{ fontSize:'0.68rem',background:'rgba(26,127,168,0.1)',color:'#1a7fa8',padding:'2px 7px',borderRadius:6 }}><Camera size={10}/> {a.photos.length}</span>}
                      {a.location?.coordinates && <span style={{ fontSize:'0.68rem',background:'rgba(224,92,58,0.1)',color:'#e05c3a',padding:'2px 7px',borderRadius:6 }}><MapPin size={10}/> GPS</span>}
                      {a.aiVerification?.analyzed && <span style={{ fontSize:'0.68rem',background:'rgba(45,155,90,0.1)',color:'var(--leaf)',padding:'2px 7px',borderRadius:6 }}>{a.aiVerification.confidence}%</span>}
                      {a.isFlagged && <span style={{ fontSize:'0.68rem',background:'rgba(232,160,32,0.1)',color:'var(--gold)',padding:'2px 7px',borderRadius:6 }}>⚠️</span>}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div style={{ marginTop:14,paddingTop:14,borderTop:'1px solid var(--cloud)' }}>
                    {a.description && <p style={{ fontSize:'0.83rem',color:'var(--ash)',marginBottom:12 }}>{a.description}</p>}
                    {a.photos?.length > 0 && (
                      <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
                        {a.photos.map((p,i) => <img key={i} src={p.url} alt="" style={{ width:100,height:75,objectFit:'cover',borderRadius:8,border:'1px solid var(--cloud)' }}/>)}
                      </div>
                    )}
                    {a.aiVerification?.analyzed && (
                      <div style={{ background:'rgba(26,127,168,0.06)',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:'0.8rem',color:'var(--sky)' }}>
                        🤖 AI: {a.aiVerification.analysisDetails} | Confidence: {a.aiVerification.confidence}%
                      </div>
                    )}
                    {a.isFlagged && (
                      <div style={{ background:'rgba(232,160,32,0.1)',borderRadius:10,padding:'8px 14px',marginBottom:12,fontSize:'0.8rem',color:'#b87f10' }}>
                        ⚠️ Nearby submissions detected – possible duplicate
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Review panel (sticky) */}
        <div style={{ position:'sticky',top:20,background:'white',border:'1px solid var(--cloud)',borderRadius:18,padding:'24px',display:'flex',flexDirection:'column',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <ShieldCheck size={20} style={{ color:'var(--canopy)' }}/>
            <h4 style={{ color:'var(--forest)' }}>Review Activity</h4>
          </div>

          {!selected ? (
            <div style={{ textAlign:'center',padding:'32px 16px',color:'var(--fog)' }}>
              <Clock size={32} style={{ color:'var(--cloud)',marginBottom:10 }}/>
              <p style={{ fontSize:'0.875rem' }}>Select an activity from the list to review it</p>
            </div>
          ) : (
            <>
              <div style={{ background:'var(--ivory)',borderRadius:12,padding:'14px' }}>
                <div style={{ fontWeight:700,color:'var(--forest)',marginBottom:4 }}>{selected.title}</div>
                <div style={{ fontSize:'0.8rem',color:'var(--fog)' }}>Potential: {selected.carbonSaved?.toFixed(1)} kg CO₂ · {selected.carbonCreditsEarned?.toFixed(4)} credits</div>
              </div>

              {/* Decision buttons */}
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={() => setDecision('approve')} style={{
                  flex:1, display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  padding:'11px', borderRadius:12, border:`2px solid ${decision==='approve'?'var(--leaf)':'var(--cloud)'}`,
                  background:decision==='approve'?'rgba(45,155,90,0.1)':'white',
                  color:decision==='approve'?'var(--leaf)':'var(--ash)', fontWeight:600, cursor:'pointer', fontSize:'0.875rem'
                }}>
                  <Check size={16}/> Approve
                </button>
                <button onClick={() => setDecision('reject')} style={{
                  flex:1, display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  padding:'11px', borderRadius:12, border:`2px solid ${decision==='reject'?'#e05c3a':'var(--cloud)'}`,
                  background:decision==='reject'?'rgba(224,92,58,0.1)':'white',
                  color:decision==='reject'?'#e05c3a':'var(--ash)', fontWeight:600, cursor:'pointer', fontSize:'0.875rem'
                }}>
                  <X size={16}/> Reject
                </button>
              </div>

              <div>
                <label style={{ fontSize:'0.83rem',fontWeight:600,color:'var(--charcoal)',display:'block',marginBottom:6 }}>Auditor Note</label>
                <textarea rows={3} placeholder={decision==='reject'?'Reason for rejection (required)…':'Optional note for the submitter…'} value={note} onChange={e=>setNote(e.target.value)} style={{ width:'100%',resize:'vertical' }}/>
              </div>

              <button onClick={handleVerify} disabled={!decision || processing || (decision==='reject'&&!note.trim())} style={{
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                padding:'13px', borderRadius:12, border:'none', fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
                background:!decision?'var(--cloud)':decision==='approve'?'linear-gradient(135deg,#1a6b3c,#2d9b5a)':'linear-gradient(135deg,#b82010,#e05c3a)',
                color:'white', transition:'all 0.18s ease',
                opacity:(!decision||processing)||(decision==='reject'&&!note.trim())?0.6:1
              }}>
                {processing ? <Loader size={16} className="animate-spin"/> : decision==='approve' ? <><Check size={16}/> Confirm Approval</> : decision==='reject' ? <><X size={16}/> Confirm Rejection</> : 'Select decision above'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
