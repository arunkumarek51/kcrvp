// Leaderboard.js
import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Award, TreePine, Zap, Car, Wheat } from 'lucide-react';

const ROLE_COLORS = { citizen:'#2d9b5a',farmer:'#e8a020',auditor:'#1a7fa8',company:'#7b4fd4',admin:'#e05c3a' };
const ROLE_ICONS  = { citizen:'🧑',farmer:'🌾',auditor:'🔍',company:'🏢',admin:'⚡' };

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/leaderboard').then(({ data }) => setLeaders(data.leaderboard || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const top3 = leaders.slice(0,3);
  const rest = leaders.slice(3);
  const myRank = leaders.findIndex(l => l._id === user?._id) + 1;

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = [80, 110, 60];
  const podiumColors = ['#C0C0C0','#FFD700','#CD7F32'];
  const podiumRanks  = [2,1,3];

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:28 }} className="animate-fadeIn">
      <div>
        <h2 style={{ color:'var(--forest)' }}>Green Champions</h2>
        <p style={{ color:'var(--fog)' }}>Kerala's top carbon savers · {leaders.length} participants</p>
        {myRank > 0 && <p style={{ color:'var(--canopy)',fontWeight:600,marginTop:4 }}>Your rank: #{myRank}</p>}
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div style={{ background:'linear-gradient(135deg,#0d3b2e,#1a6b3c)',borderRadius:24,padding:'36px 24px 0',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:12,overflow:'hidden' }}>
          {podiumOrder.map((leader,i) => leader ? (
            <div key={leader._id} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,flex:1,maxWidth:180 }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:64,height:64,borderRadius:'50%',background:`${ROLE_COLORS[leader.role]||'#2d9b5a'}30`,border:`3px solid ${podiumColors[i]}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',fontWeight:800,color:'white' }}>
                  {ROLE_ICONS[leader.role]||'🌿'}
                </div>
                <div style={{ position:'absolute',top:-8,right:-8,width:26,height:26,borderRadius:'50%',background:podiumColors[i],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:800,color:podiumRanks[i]===1?'#1a1a1a':'white' }}>
                  {podiumRanks[i]===1?'🥇':podiumRanks[i]===2?'🥈':'🥉'}
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ color:'white',fontWeight:700,fontSize:'0.85rem',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{leader.name}</div>
                <div style={{ color:'rgba(255,255,255,0.5)',fontSize:'0.7rem' }}>{leader.district||'Kerala'}</div>
                <div style={{ color:'#4cc97f',fontFamily:'JetBrains Mono',fontWeight:800,fontSize:'1rem',marginTop:4 }}>{(leader.totalCarbonSaved||0).toFixed(0)} kg</div>
              </div>
              <div style={{ width:'100%',height:podiumHeights[i],background:`${podiumColors[i]}30`,border:`2px solid ${podiumColors[i]}50`,borderRadius:'12px 12px 0 0',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <span style={{ color:podiumColors[i],fontWeight:800,fontSize:'1.4rem' }}>#{podiumRanks[i]}</span>
              </div>
            </div>
          ) : null)}
        </div>
      )}

      {/* Full table */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,overflow:'hidden' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--cloud)',display:'grid',gridTemplateColumns:'40px 1fr 100px 100px 80px',gap:12,fontSize:'0.72rem',fontWeight:700,color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.06em' }}>
          <span>#</span><span>Champion</span><span style={{ textAlign:'right' }}>CO₂ Saved</span><span style={{ textAlign:'right' }}>Credits</span><span style={{ textAlign:'right' }}>Score</span>
        </div>
        {loading ? [...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{ height:56,margin:8,borderRadius:8 }}/>) : (
          leaders.map((leader,i) => {
            const isMe = leader._id === user?._id;
            return (
              <div key={leader._id} style={{
                display:'grid',gridTemplateColumns:'40px 1fr 100px 100px 80px',gap:12,alignItems:'center',
                padding:'12px 20px',background:isMe?'rgba(45,155,90,0.06)':'transparent',
                borderBottom:'1px solid var(--cloud)',transition:'background 0.15s'
              }} onMouseEnter={e=>!isMe&&(e.currentTarget.style.background='var(--ivory)')} onMouseLeave={e=>!isMe&&(e.currentTarget.style.background='transparent')}>
                <span style={{ fontWeight:800,color:i<3?['var(--gold)','var(--fog)','#CD7F32'][i]:'var(--fog)',fontSize:i<3?'1.1rem':'0.9rem' }}>
                  {i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}
                </span>
                <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0 }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:`${ROLE_COLORS[leader.role]||'#2d9b5a'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0 }}>
                    {ROLE_ICONS[leader.role]||'🌿'}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {leader.name}{isMe&&' (You)'}
                    </div>
                    <div style={{ fontSize:'0.7rem',color:'var(--fog)' }}>{leader.district||'Kerala'}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right',fontFamily:'JetBrains Mono',fontWeight:700,color:'var(--leaf)',fontSize:'0.875rem' }}>{(leader.totalCarbonSaved||0).toFixed(0)} kg</div>
                <div style={{ textAlign:'right',fontFamily:'JetBrains Mono',fontWeight:600,color:'var(--gold)',fontSize:'0.875rem' }}>{(leader.carbonCredits||0).toFixed(3)}</div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ display:'inline-flex',alignItems:'center',gap:4,background:leader.sustainabilityScore>=70?'rgba(45,155,90,0.1)':leader.sustainabilityScore>=40?'rgba(232,160,32,0.1)':'rgba(224,92,58,0.1)',color:leader.sustainabilityScore>=70?'var(--leaf)':leader.sustainabilityScore>=40?'var(--gold)':'var(--coral)',padding:'3px 8px',borderRadius:99,fontSize:'0.75rem',fontWeight:700 }}>
                    {leader.sustainabilityScore||0}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
