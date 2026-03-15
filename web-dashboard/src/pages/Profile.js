import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Award, Leaf, TreePine, Zap, Car, Wheat, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS = { citizen:'#2d9b5a',farmer:'#e8a020',auditor:'#1a7fa8',company:'#7b4fd4',admin:'#e05c3a' };
const ROLE_LABELS = { citizen:'Citizen',farmer:'Farmer',auditor:'Auditor',company:'Company',admin:'Admin' };

const DISTRICTS = ['Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam','Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'];

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', district:'', bio:'' });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ name:user.name||'', phone:user.phone||'', district:user.district||'', bio:user.bio||'' });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateUser(form);
      toast.success('Profile updated! ✅');
      setEditing(false);
    } catch(err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const roleColor = ROLE_COLORS[user?.role] || '#2d9b5a';
  const score = user?.sustainabilityScore || 0;
  const scoreColor = score >= 70 ? '#2d9b5a' : score >= 40 ? '#e8a020' : '#e05c3a';
  const scoreLabel = score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Getting Started';

  return (
    <div style={{ maxWidth:720,display:'flex',flexDirection:'column',gap:20 }} className="animate-fadeIn">
      <h2 style={{ color:'var(--forest)' }}>My Profile</h2>

      {/* Profile header */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:20,overflow:'hidden' }}>
        <div style={{ background:`linear-gradient(135deg,${roleColor}12,${roleColor}06)`,borderBottom:'1px solid var(--cloud)',padding:'28px 28px 24px' }}>
          <div style={{ display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <div style={{ width:80,height:80,borderRadius:'50%',background:`${roleColor}20`,border:`3px solid ${roleColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:800,color:roleColor,overflow:'hidden' }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : user?.name?.charAt(0)}
              </div>
            </div>
            <div style={{ flex:1,minWidth:200 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                <h3 style={{ color:'var(--forest)',margin:0 }}>{user?.name}</h3>
                <span style={{ background:`${roleColor}18`,color:roleColor,padding:'4px 12px',borderRadius:99,fontSize:'0.78rem',fontWeight:700 }}>
                  {ROLE_LABELS[user?.role]}
                </span>
                {user?.role === 'auditor' && user?.auditorApproved && (
                  <span style={{ background:'rgba(26,127,168,0.1)',color:'#1a7fa8',padding:'4px 10px',borderRadius:99,fontSize:'0.72rem',fontWeight:600 }}>✓ Approved Auditor</span>
                )}
              </div>
              <div style={{ display:'flex',gap:16,marginTop:10,flexWrap:'wrap' }}>
                {user?.email && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:'0.85rem',color:'var(--ash)' }}><Mail size={14}/>{user.email}</span>}
                {user?.district && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:'0.85rem',color:'var(--ash)' }}><MapPin size={14}/>{user.district}, Kerala</span>}
                {user?.phone && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:'0.85rem',color:'var(--ash)' }}><Phone size={14}/>{user.phone}</span>}
              </div>
              {user?.bio && <p style={{ fontSize:'0.875rem',color:'var(--ash)',marginTop:10 }}>{user.bio}</p>}
              {user?.companyName && <p style={{ fontSize:'0.875rem',color:'var(--canopy)',fontWeight:600,marginTop:6 }}>🏢 {user.companyName}</p>}
            </div>
            <button onClick={startEdit} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'1.5px solid var(--cloud)',borderRadius:10,padding:'8px 16px',fontSize:'0.82rem',fontWeight:600,color:'var(--ash)',cursor:'pointer',transition:'all 0.15s' }}>
              <Edit3 size={14}/> Edit Profile
            </button>
          </div>
        </div>

        {/* Wallet address */}
        {user?.walletAddress && (
          <div style={{ padding:'14px 28px',borderBottom:'1px solid var(--cloud)',display:'flex',alignItems:'center',gap:8 }}>
            <LinkIcon size={14} style={{ color:'#7b4fd4',flexShrink:0 }}/>
            <span style={{ fontSize:'0.72rem',color:'var(--fog)' }}>Wallet:</span>
            <span style={{ fontFamily:'JetBrains Mono',fontSize:'0.72rem',color:'var(--ash)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.walletAddress}</span>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',padding:'20px 24px',gap:16 }}>
          {[
            { icon:'🌱', label:'Activities', val:user?.totalActivities||0 },
            { icon:'💨', label:'kg CO₂ Saved', val:(user?.totalCarbonSaved||0).toFixed(1) },
            { icon:'🪙', label:'Credits', val:(user?.carbonCredits||0).toFixed(4) },
            { icon:'💰', label:'Wallet ₹', val:(user?.walletBalance||0).toLocaleString('en-IN') },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem',marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontWeight:800,color:'var(--forest)',fontFamily:'JetBrains Mono',fontSize:'1.1rem' }}>{s.val}</div>
              <div style={{ fontSize:'0.68rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sustainability score */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'22px 24px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
          <h4 style={{ color:'var(--forest)' }}>Sustainability Score</h4>
          <span style={{ background:`${scoreColor}18`,color:scoreColor,padding:'4px 14px',borderRadius:99,fontSize:'0.8rem',fontWeight:700 }}>{scoreLabel}</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ flex:1,height:12,background:'var(--cloud)',borderRadius:99,overflow:'hidden' }}>
            <div style={{ width:`${score}%`,height:'100%',background:`linear-gradient(90deg,${scoreColor}80,${scoreColor})`,borderRadius:99,transition:'width 1s ease' }}/>
          </div>
          <span style={{ fontWeight:800,color:scoreColor,fontSize:'1.2rem',fontFamily:'JetBrains Mono',width:50,textAlign:'right' }}>{score}/100</span>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:16 }}>
          {[
            { icon:<TreePine size={18}/>, label:'Trees', val:user?.treesPlanted||0, color:'#2d9b5a' },
            { icon:<Zap size={18}/>,     label:'kWh',   val:user?.solarKwh||0,    color:'#e8a020' },
            { icon:<Car size={18}/>,     label:'km EV', val:user?.evKmDriven||0,  color:'#1a7fa8' },
            { icon:<Wheat size={18}/>,   label:'Acres', val:user?.farmingAcres||0,color:'#7b4fd4' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--ivory)',borderRadius:12,padding:'12px',textAlign:'center' }}>
              <div style={{ color:s.color,display:'flex',justifyContent:'center',marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--forest)',fontSize:'1rem' }}>{s.val}</div>
              <div style={{ fontSize:'0.68rem',color:'var(--fog)',textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,59,46,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}>
          <div className="animate-scaleIn" style={{ background:'white',borderRadius:20,padding:'32px',width:'100%',maxWidth:480,margin:'20px',maxHeight:'90vh',overflowY:'auto' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
              <h3 style={{ color:'var(--forest)' }}>Edit Profile</h3>
              <button onClick={() => setEditing(false)} style={{ background:'none',border:'none',color:'var(--fog)',cursor:'pointer',padding:4 }}><X size={20}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {[
                { label:'Full Name *', key:'name', type:'text', placeholder:'Your name' },
                { label:'Phone Number', key:'phone', type:'tel', placeholder:'+91 98765 43210' },
                { label:'Bio', key:'bio', type:'textarea', placeholder:'Tell others about your green journey…' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)',display:'block',marginBottom:6 }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(fm=>({...fm,[f.key]:e.target.value}))} style={{ resize:'vertical' }}/>
                  ) : (
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(fm=>({...fm,[f.key]:e.target.value}))}/>
                  )}
                </div>
              ))}
              <div>
                <label style={{ fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)',display:'block',marginBottom:6 }}>District</label>
                <select value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:24 }}>
              <button onClick={()=>setEditing(false)} style={{ flex:1,padding:'12px',background:'none',border:'1.5px solid var(--cloud)',borderRadius:12,fontWeight:600,cursor:'pointer',color:'var(--ash)' }}><X size={14}/> Cancel</button>
              <button onClick={saveProfile} disabled={saving} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'12px',background:'linear-gradient(135deg,#1a6b3c,#2d9b5a)',color:'white',border:'none',borderRadius:12,fontWeight:600,cursor:'pointer' }}>
                <Save size={14}/> {saving?'Saving…':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
