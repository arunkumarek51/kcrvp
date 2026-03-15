import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { TreePine, Zap, Car, Wheat, MapPin, Camera, Shield, CheckCircle, XCircle, Clock, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIVITY_CONFIG = {
  tree_planting:  { label:'Tree Planting', icon: TreePine, color:'#2d9b5a', bg:'rgba(45,155,90,0.1)', unit:'trees' },
  solar_energy:   { label:'Solar Energy',  icon: Zap,      color:'#e8a020', bg:'rgba(232,160,32,0.1)', unit:'kWh' },
  ev_driving:     { label:'EV Driving',    icon: Car,      color:'#1a7fa8', bg:'rgba(26,127,168,0.1)', unit:'km' },
  organic_farming:{ label:'Organic Farm',  icon: Wheat,    color:'#7b4fd4', bg:'rgba(123,79,212,0.1)', unit:'acres' },
};

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/activities/${id}`);
        setActivity(data.activity);
      } catch { toast.error('Activity not found'); navigate('/activities'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const recordOnChain = async () => {
    if (!activity?.carbonCreditsEarned) return toast.error('No credits to record');
    setRecording(true);
    try {
      const { data } = await api.post('/blockchain/record/' + id);
      toast.success('Recorded on Polygon blockchain! 🔗');
      setActivity(a => ({ ...a, blockchainRecorded: true, blockchainTxHash: data.txHash }));
    } catch (err) { toast.error(err.response?.data?.message || 'Blockchain recording failed'); }
    finally { setRecording(false); }
  };

  if (loading) return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height: i===0?200:100 }}/>)}
    </div>
  );
  if (!activity) return null;

  const cfg = ACTIVITY_CONFIG[activity.type] || {};
  const Icon = cfg.icon || TreePine;
  const ai = activity.aiVerification || {};
  const isOwner = activity.user?._id === user?._id || activity.user === user?._id;

  const statusBadge = {
    pending:          { label:'Pending Review',   color:'#b87f10', bg:'rgba(232,160,32,0.12)', icon: Clock },
    ai_verified:      { label:'AI Verified',      color:'#1a7fa8', bg:'rgba(26,127,168,0.12)', icon: Shield },
    auditor_verified: { label:'Auditor Verified', color:'#2d9b5a', bg:'rgba(45,155,90,0.12)',  icon: CheckCircle },
    approved:         { label:'Approved ✓',       color:'#2d9b5a', bg:'rgba(45,155,90,0.12)',  icon: CheckCircle },
    rejected:         { label:'Rejected',         color:'#e05c3a', bg:'rgba(224,92,58,0.12)',  icon: XCircle },
  }[activity.verificationStatus] || {};
  const StatusIcon = statusBadge.icon || Clock;

  return (
    <div style={{ maxWidth:800, display:'flex', flexDirection:'column', gap:20 }} className="animate-fadeIn">
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'var(--canopy)',fontWeight:600,fontSize:'0.875rem',cursor:'pointer',alignSelf:'flex-start',padding:'4px 0' }}>
        <ArrowLeft size={16}/> Back
      </button>

      {/* Header card */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:20,overflow:'hidden' }}>
        <div style={{ background:`linear-gradient(135deg,${cfg.color}18,${cfg.color}08)`,borderBottom:`1px solid ${cfg.color}20`,padding:'24px 28px' }}>
          <div style={{ display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap' }}>
            <div style={{ width:56,height:56,borderRadius:16,background:cfg.bg,color:cfg.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={26} strokeWidth={1.8}/>
            </div>
            <div style={{ flex:1 }}>
              <h2 style={{ color:'var(--forest)',marginBottom:4 }}>{activity.title}</h2>
              <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'center' }}>
                <span style={{ background:`${cfg.color}18`,color:cfg.color,padding:'3px 12px',borderRadius:99,fontSize:'0.78rem',fontWeight:600 }}>{cfg.label}</span>
                <span style={{ background:statusBadge.bg,color:statusBadge.color,padding:'3px 12px',borderRadius:99,fontSize:'0.78rem',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>
                  <StatusIcon size={12}/> {statusBadge.label}
                </span>
                {activity.isFlagged && <span style={{ background:'rgba(224,92,58,0.1)',color:'#e05c3a',padding:'3px 12px',borderRadius:99,fontSize:'0.78rem',fontWeight:600 }}>⚠️ Flagged</span>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'2rem',fontWeight:800,color:cfg.color,fontFamily:'JetBrains Mono' }}>{activity.carbonSaved?.toFixed(1)}</div>
              <div style={{ fontSize:'0.72rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.06em' }}>kg CO₂ saved</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid var(--cloud)' }}>
          {[
            { label:'Quantity', value:`${activity.quantity} ${cfg.unit}` },
            { label:'Credits Earned', value:(activity.carbonCreditsEarned||0).toFixed(4) },
            { label:'Submitted', value:new Date(activity.submittedAt).toLocaleDateString('en-IN') },
            { label:'AI Confidence', value:ai.analyzed ? `${ai.confidence}%` : 'Pending' },
          ].map((s,i) => (
            <div key={i} style={{ padding:'16px 20px',borderRight:i<3?'1px solid var(--cloud)':'none',textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem',fontWeight:800,color:'var(--forest)',fontFamily:'JetBrains Mono' }}>{s.value}</div>
              <div style={{ fontSize:'0.68rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'20px 28px', display:'flex', flexDirection:'column', gap:16 }}>
          {activity.description && <p style={{ color:'var(--ash)' }}>{activity.description}</p>}

          {/* Submitter */}
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(45,155,90,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--canopy)' }}>
              {activity.user?.name?.charAt(0)||'?'}
            </div>
            <div>
              <div style={{ fontSize:'0.875rem',fontWeight:600,color:'var(--charcoal)' }}>{activity.user?.name || 'Unknown'}</div>
              <div style={{ fontSize:'0.75rem',color:'var(--fog)' }}>{activity.user?.role} · {activity.user?.district || 'Kerala'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      {activity.photos?.length > 0 && (
        <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'20px 24px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
            <Camera size={18} style={{ color:'var(--canopy)' }}/>
            <h4 style={{ color:'var(--forest)' }}>Photo Evidence</h4>
          </div>
          <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
            {activity.photos.map((p,i) => (
              <img key={i} src={p.url} alt={`Evidence ${i+1}`} style={{ width:180,height:140,objectFit:'cover',borderRadius:12,border:'1px solid var(--cloud)' }}/>
            ))}
          </div>
        </div>
      )}

      {/* AI Verification */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'20px 24px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
          <Shield size={18} style={{ color:'#1a7fa8' }}/>
          <h4 style={{ color:'var(--forest)' }}>AI Verification</h4>
        </div>
        {ai.analyzed ? (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontSize:'0.85rem',color:'var(--ash)' }}>Confidence Score</span>
                  <span style={{ fontSize:'0.85rem',fontWeight:700,color:ai.confidence>70?'var(--leaf)':'var(--gold)' }}>{ai.confidence}%</span>
                </div>
                <div style={{ height:8,background:'var(--cloud)',borderRadius:99,overflow:'hidden' }}>
                  <div style={{ width:`${ai.confidence}%`,height:'100%',background:ai.confidence>70?'var(--leaf)':'var(--gold)',borderRadius:99,transition:'width 1s ease' }}/>
                </div>
              </div>
              <span style={{
                padding:'5px 14px',borderRadius:99,fontSize:'0.8rem',fontWeight:600,
                background:ai.verificationStatus==='passed'?'rgba(45,155,90,0.1)':'rgba(232,160,32,0.1)',
                color:ai.verificationStatus==='passed'?'var(--leaf)':'var(--gold)'
              }}>
                {ai.verificationStatus==='passed'?'✅ Passed':'⚠️ Review Needed'}
              </span>
            </div>
            {ai.detectedObjects?.length > 0 && (
              <div>
                <div style={{ fontSize:'0.78rem',color:'var(--fog)',marginBottom:6 }}>Detected objects:</div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  {ai.detectedObjects.map((obj,i) => (
                    <span key={i} style={{ background:'var(--ivory)',color:'var(--ash)',padding:'3px 10px',borderRadius:8,fontSize:'0.75rem' }}>{obj}</span>
                  ))}
                </div>
              </div>
            )}
            {ai.analysisDetails && <p style={{ fontSize:'0.8rem',color:'var(--fog)' }}>{ai.analysisDetails}</p>}
          </div>
        ) : (
          <p style={{ color:'var(--fog)',fontSize:'0.875rem' }}>AI analysis pending. Results will appear once processed.</p>
        )}
      </div>

      {/* Location */}
      {activity.location?.coordinates && (
        <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'20px 24px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <MapPin size={18} style={{ color:'var(--coral)' }}/>
            <h4 style={{ color:'var(--forest)' }}>GPS Location</h4>
          </div>
          <div style={{ display:'flex',gap:12,flexWrap:'wrap',fontSize:'0.85rem' }}>
            <span style={{ background:'var(--ivory)',padding:'6px 14px',borderRadius:10,fontFamily:'JetBrains Mono',color:'var(--ash)' }}>
              📍 {activity.location.coordinates[1]?.toFixed(5)}, {activity.location.coordinates[0]?.toFixed(5)}
            </span>
            {activity.location.district && <span style={{ background:'var(--ivory)',padding:'6px 14px',borderRadius:10,color:'var(--ash)' }}>🏘️ {activity.location.district}</span>}
          </div>
        </div>
      )}

      {/* Auditor notes */}
      {activity.auditor && (
        <div style={{ background:'rgba(45,155,90,0.06)',border:'1px solid rgba(45,155,90,0.2)',borderRadius:16,padding:'20px 24px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
            <CheckCircle size={18} style={{ color:'var(--leaf)' }}/>
            <h4 style={{ color:'var(--forest)' }}>Auditor Review</h4>
          </div>
          <p style={{ fontSize:'0.85rem',color:'var(--ash)' }}><strong>Reviewed by:</strong> {activity.auditor?.name}</p>
          {activity.auditorNote && <p style={{ fontSize:'0.85rem',color:'var(--ash)',marginTop:6 }}><strong>Note:</strong> {activity.auditorNote}</p>}
          {activity.auditorVerifiedAt && <p style={{ fontSize:'0.78rem',color:'var(--fog)',marginTop:6 }}>{new Date(activity.auditorVerifiedAt).toLocaleString('en-IN')}</p>}
        </div>
      )}

      {/* Blockchain */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'20px 24px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
          <LinkIcon size={18} style={{ color:'#7b4fd4' }}/>
          <h4 style={{ color:'var(--forest)' }}>Blockchain Record</h4>
        </div>
        {activity.blockchainRecorded || activity.blockchainTxHash ? (
          <div>
            <span style={{ background:'rgba(123,79,212,0.1)',color:'#7b4fd4',padding:'4px 12px',borderRadius:8,fontSize:'0.78rem',fontWeight:600 }}>✓ Recorded on Polygon</span>
            {activity.blockchainTxHash && (
              <div style={{ marginTop:10,fontFamily:'JetBrains Mono',fontSize:'0.72rem',color:'var(--fog)',wordBreak:'break-all',background:'var(--ivory)',padding:'8px 12px',borderRadius:8 }}>
                {activity.blockchainTxHash}
              </div>
            )}
          </div>
        ) : isOwner && activity.verificationStatus === 'approved' ? (
          <div>
            <p style={{ fontSize:'0.85rem',color:'var(--fog)',marginBottom:12 }}>This approved activity's credits can be permanently recorded on the Polygon blockchain for immutable verification.</p>
            <button onClick={recordOnChain} disabled={recording} style={{
              display:'flex',alignItems:'center',gap:8,
              background:'linear-gradient(135deg,#5b21b6,#7b4fd4)',color:'white',border:'none',
              borderRadius:12,padding:'10px 20px',fontSize:'0.875rem',fontWeight:600,cursor:'pointer'
            }}>
              {recording ? '⏳ Recording…' : '🔗 Record on Blockchain'}
            </button>
          </div>
        ) : (
          <p style={{ fontSize:'0.85rem',color:'var(--fog)' }}>Activity must be approved before blockchain recording.</p>
        )}
      </div>
    </div>
  );
}
