import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Users, Shield, AlertTriangle, BarChart3, ToggleLeft, ToggleRight, Check, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Users','Auditors','Flagged','Stats'];
const ROLE_COLORS = { citizen:'#2d9b5a',farmer:'#e8a020',auditor:'#1a7fa8',company:'#7b4fd4',admin:'#e05c3a' };

export default function AdminPanel() {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addBalUser, setAddBalUser] = useState(null);
  const [balAmount, setBalAmount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const [usersRes, flaggedRes, statsRes] = await Promise.all([
        api.get(`/admin/users?${params}&limit=50`),
        api.get('/admin/flagged'),
        api.get('/stats/platform')
      ]);
      setUsers(usersRes.data.users || []);
      setFlagged(flaggedRes.data.activities || []);
      setPlatformStats(statsRes.data.stats);
    } catch(e) { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const approveAuditor = async (userId) => {
    try {
      await api.put(`/admin/approve-auditor/${userId}`);
      toast.success('Auditor approved!');
      fetchData();
    } catch(e) { toast.error('Failed'); }
  };

  const toggleUser = async (userId) => {
    try {
      const { data } = await api.put(`/admin/toggle-user/${userId}`);
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch(e) { toast.error('Failed'); }
  };

  const addBalance = async () => {
    if (!balAmount || isNaN(balAmount)) return toast.error('Enter valid amount');
    try {
      await api.put(`/admin/add-balance/${addBalUser._id}`, { amount: balAmount });
      toast.success(`Added ₹${parseInt(balAmount).toLocaleString('en-IN')} to ${addBalUser.name}'s wallet`);
      setAddBalUser(null); setBalAmount('');
      fetchData();
    } catch(e) { toast.error('Failed'); }
  };

  const auditors = users.filter(u => u.role === 'auditor');

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:24 }} className="animate-fadeIn">
      <div><h2 style={{ color:'var(--forest)' }}>Admin Panel</h2><p style={{ color:'var(--fog)' }}>Manage users, auditors, and platform operations</p></div>

      {/* Tab bar */}
      <div style={{ display:'flex',gap:4,background:'var(--ivory)',borderRadius:14,padding:4,width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'8px 20px',borderRadius:10,border:'none',fontSize:'0.875rem',fontWeight:600,cursor:'pointer',
            background:tab===t?'white':'transparent', color:tab===t?'var(--forest)':'var(--fog)',
            boxShadow:tab===t?'var(--shadow-sm)':'none', transition:'all 0.15s ease'
          }}>{t}</button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'Stats' && platformStats && (
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14 }}>
            {[
              { label:'Total Users',    val:platformStats.totalUsers,                        color:'var(--canopy)' },
              { label:'Total Activities',val:platformStats.totalActivities,                  color:'#1a7fa8' },
              { label:'Approved',       val:platformStats.approvedActivities,                color:'var(--leaf)' },
              { label:'Credits Issued', val:(platformStats.totalCredits||0).toFixed(2),      color:'var(--gold)' },
              { label:'CO₂ Saved (kg)', val:(platformStats.totalCarbonSaved||0).toFixed(0), color:'#2d9b5a' },
              { label:'Active Listings',val:platformStats.activeListings||0,                 color:'#7b4fd4' },
            ].map((s,i) => (
              <div key={i} style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:14,padding:'18px 20px',borderLeft:`4px solid ${s.color}` }}>
                <div style={{ fontSize:'1.5rem',fontWeight:800,color:'var(--forest)',fontFamily:'JetBrains Mono' }}>{s.val}</div>
                <div style={{ fontSize:'0.72rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {platformStats.districtStats?.length > 0 && (
            <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:14,padding:'20px 24px' }}>
              <h4 style={{ color:'var(--forest)',marginBottom:14 }}>Top Districts by CO₂ Saved</h4>
              {platformStats.districtStats.slice(0,8).map((d,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                  <span style={{ width:20,fontSize:'0.75rem',fontWeight:700,color:'var(--fog)' }}>#{i+1}</span>
                  <span style={{ flex:1,fontSize:'0.875rem',color:'var(--charcoal)',fontWeight:500 }}>{d._id}</span>
                  <div style={{ flex:2,height:8,background:'var(--cloud)',borderRadius:99,overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(100,(d.carbonSaved/platformStats.districtStats[0].carbonSaved)*100)}%`,height:'100%',background:'var(--leaf)',borderRadius:99 }}/>
                  </div>
                  <span style={{ fontSize:'0.78rem',fontFamily:'JetBrains Mono',color:'var(--leaf)',width:80,textAlign:'right' }}>{d.carbonSaved.toFixed(0)} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'Users' && (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            <input placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1,minWidth:200 }}/>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ width:140 }}>
              <option value="">All Roles</option>
              {['citizen','farmer','auditor','company','admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={fetchData} style={{ background:'var(--canopy)',color:'white',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,cursor:'pointer' }}>Search</button>
          </div>
          {loading ? [...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:72 }}/>) : (
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {users.map(u => (
                <div key={u._id} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'white',border:'1px solid var(--cloud)',borderRadius:12,opacity:u.isActive?1:0.6 }}>
                  <div style={{ width:40,height:40,borderRadius:'50%',background:`${ROLE_COLORS[u.role]||'#2d9b5a'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:ROLE_COLORS[u.role]||'var(--canopy)',flexShrink:0 }}>
                    {u.name?.charAt(0)}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.875rem' }}>{u.name}</div>
                    <div style={{ fontSize:'0.72rem',color:'var(--fog)' }}>{u.email} · {u.district||'Kerala'}</div>
                  </div>
                  <span style={{ padding:'3px 10px',borderRadius:99,fontSize:'0.72rem',fontWeight:600,background:`${ROLE_COLORS[u.role]||'#2d9b5a'}18`,color:ROLE_COLORS[u.role]||'var(--canopy)' }}>{u.role}</span>
                  <span style={{ fontSize:'0.78rem',fontFamily:'JetBrains Mono',color:'var(--leaf)' }}>{(u.totalCarbonSaved||0).toFixed(0)} kg</span>
                  <span style={{ fontSize:'0.78rem',color:'var(--fog)' }}>₹{(u.walletBalance||0).toLocaleString('en-IN')}</span>
                  <button onClick={() => { setAddBalUser(u); setBalAmount(''); }} style={{ background:'none',border:'1.5px solid var(--cloud)',borderRadius:8,padding:'5px 10px',fontSize:'0.72rem',fontWeight:600,color:'var(--ash)',cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                    <Wallet size={12}/> Add Bal
                  </button>
                  <button onClick={() => toggleUser(u._id)} style={{ background:'none',border:'none',cursor:'pointer',color:u.isActive?'var(--leaf)':'var(--coral)',padding:4 }}>
                    {u.isActive ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auditors tab */}
      {tab === 'Auditors' && (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <p style={{ fontSize:'0.875rem',color:'var(--fog)' }}>Approve auditors to allow them to verify activities.</p>
          {auditors.length === 0 ? (
            <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:14,padding:'40px',textAlign:'center',color:'var(--fog)' }}>No auditor registrations yet.</div>
          ) : auditors.map(u => (
            <div key={u._id} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'white',border:'1px solid var(--cloud)',borderRadius:12 }}>
              <div style={{ width:44,height:44,borderRadius:'50%',background:'rgba(26,127,168,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#1a7fa8',flexShrink:0 }}>
                {u.name?.charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,color:'var(--charcoal)' }}>{u.name}</div>
                <div style={{ fontSize:'0.75rem',color:'var(--fog)' }}>{u.email} · {u.district||'Kerala'}</div>
              </div>
              <span style={{ fontSize:'0.78rem',color:'var(--fog)' }}>Joined {new Date(u.createdAt).toLocaleDateString('en-IN')}</span>
              {u.auditorApproved ? (
                <span style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(45,155,90,0.1)',color:'var(--leaf)',padding:'5px 14px',borderRadius:99,fontSize:'0.8rem',fontWeight:600 }}>
                  <Check size={13}/> Approved
                </span>
              ) : (
                <button onClick={() => approveAuditor(u._id)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--canopy)',color:'white',border:'none',borderRadius:10,padding:'8px 16px',fontSize:'0.82rem',fontWeight:600,cursor:'pointer' }}>
                  <Shield size={14}/> Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Flagged tab */}
      {tab === 'Flagged' && (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <p style={{ fontSize:'0.875rem',color:'var(--fog)' }}>{flagged.length} flagged submissions detected (possible duplicates or suspicious GPS).</p>
          {flagged.length === 0 ? (
            <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:14,padding:'40px',textAlign:'center',color:'var(--fog)' }}>
              <AlertTriangle size={32} style={{ color:'var(--cloud)',marginBottom:10 }}/>
              <p>No flagged activities</p>
            </div>
          ) : flagged.map(a => (
            <div key={a._id} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'rgba(232,160,32,0.05)',border:'1px solid rgba(232,160,32,0.2)',borderRadius:12 }}>
              <AlertTriangle size={20} style={{ color:'var(--gold)',flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.875rem' }}>{a.title}</div>
                <div style={{ fontSize:'0.75rem',color:'var(--fog)' }}>{a.user?.name} · {a.user?.district} · {new Date(a.submittedAt).toLocaleDateString('en-IN')}</div>
              </div>
              <span style={{ fontSize:'0.78rem',color:'var(--gold)',background:'rgba(232,160,32,0.1)',padding:'3px 10px',borderRadius:8 }}>{a.verificationStatus}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add balance modal */}
      {addBalUser && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,59,46,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div className="animate-scaleIn" style={{ background:'white',borderRadius:20,padding:'32px',width:'100%',maxWidth:380,margin:'20px' }}>
            <h3 style={{ color:'var(--forest)',marginBottom:6 }}>Add Wallet Balance</h3>
            <p style={{ color:'var(--fog)',fontSize:'0.875rem',marginBottom:20 }}>For: <strong>{addBalUser.name}</strong> (Current: ₹{(addBalUser.walletBalance||0).toLocaleString('en-IN')})</p>
            <input type="number" min="1" placeholder="Amount in ₹ (e.g. 5000)" value={balAmount} onChange={e=>setBalAmount(e.target.value)} style={{ marginBottom:16 }}/>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setAddBalUser(null)} style={{ flex:1,padding:'12px',background:'none',border:'1.5px solid var(--cloud)',borderRadius:12,fontWeight:600,cursor:'pointer',color:'var(--ash)' }}>Cancel</button>
              <button onClick={addBalance} style={{ flex:1,padding:'12px',background:'var(--canopy)',color:'white',border:'none',borderRadius:12,fontWeight:600,cursor:'pointer' }}>Add Balance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
