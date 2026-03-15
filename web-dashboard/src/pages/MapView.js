import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { MapPin, TreePine, Zap, Car, Wheat, Leaf, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIVITY_CONFIG = {
  tree_planting:  { label:'Tree Planting', icon:'🌳', color:'#2d9b5a', bg:'rgba(45,155,90,0.1)' },
  solar_energy:   { label:'Solar Energy',  icon:'☀️', color:'#e8a020', bg:'rgba(232,160,32,0.1)' },
  ev_driving:     { label:'EV Driving',    icon:'🚗', color:'#1a7fa8', bg:'rgba(26,127,168,0.1)' },
  organic_farming:{ label:'Organic Farm',  icon:'🌾', color:'#7b4fd4', bg:'rgba(123,79,212,0.1)' },
};

// Kerala district coordinates
const KERALA_DISTRICTS = [
  { name:'Thiruvananthapuram', lat:8.5241, lng:76.9366 },
  { name:'Kollam',    lat:8.8932,  lng:76.6141 },
  { name:'Alappuzha', lat:9.4981,  lng:76.3388 },
  { name:'Kottayam',  lat:9.5916,  lng:76.5222 },
  { name:'Ernakulam', lat:10.0261, lng:76.3083 },
  { name:'Thrissur',  lat:10.5276, lng:76.2144 },
  { name:'Palakkad',  lat:10.7867, lng:76.6548 },
  { name:'Malappuram',lat:11.0510, lng:76.0711 },
  { name:'Kozhikode', lat:11.2588, lng:75.7804 },
  { name:'Wayanad',   lat:11.6854, lng:76.1320 },
  { name:'Kannur',    lat:11.8745, lng:75.3704 },
  { name:'Kasaragod', lat:12.4996, lng:74.9869 },
];

export default function MapView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [userLoc, setUserLoc] = useState(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      const { data } = await api.get(`/activities/map?${params}`);
      setActivities(data.activities || []);
    } catch { toast.error('Failed to load map data'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  // Generate a pseudo-map using CSS positioning within Kerala's bounding box
  const KERALA_BOUNDS = { latMin:8.18, latMax:12.78, lngMin:74.86, lngMax:77.42 };
  const toPercent = (lat, lng) => ({
    x: ((lng - KERALA_BOUNDS.lngMin) / (KERALA_BOUNDS.lngMax - KERALA_BOUNDS.lngMin)) * 100,
    y: 100 - ((lat - KERALA_BOUNDS.latMin) / (KERALA_BOUNDS.latMax - KERALA_BOUNDS.latMin)) * 100
  });

  const activitiesWithCoords = activities.filter(a => a.location?.coordinates?.length === 2);
  const typeBreakdown = Object.keys(ACTIVITY_CONFIG).map(type => ({
    type, count: activities.filter(a => a.type === type).length,
    carbon: activities.filter(a => a.type === type).reduce((s,a) => s+(a.carbonSaved||0), 0)
  }));
  const totalCarbon = activities.reduce((s,a) => s+(a.carbonSaved||0), 0);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }} className="animate-fadeIn">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
        <div>
          <h2 style={{ color:'var(--forest)' }}>Activity Map</h2>
          <p style={{ color:'var(--fog)' }}>{activitiesWithCoords.length} GPS-verified activities across Kerala</p>
        </div>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
          {['all',...Object.keys(ACTIVITY_CONFIG)].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{
              padding:'6px 14px',borderRadius:99,border:'1.5px solid',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',
              borderColor:typeFilter===f?'var(--canopy)':'var(--cloud)',
              background:typeFilter===f?'rgba(26,107,60,0.08)':'white',
              color:typeFilter===f?'var(--canopy)':'var(--ash)'
            }}>
              {f==='all'?'All':ACTIVITY_CONFIG[f]?.icon+' '+ACTIVITY_CONFIG[f]?.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 300px',gap:18,alignItems:'start' }}>
        {/* SVG Map */}
        <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:18,overflow:'hidden',position:'relative' }}>
          <div style={{ background:'linear-gradient(180deg,#e8f5ea 0%,#d4edda 100%)',position:'relative',height:520,overflow:'hidden' }}>
            {/* Grid lines */}
            <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.15 }}>
              {[...Array(10)].map((_,i) => <line key={`v${i}`} x1={`${i*11}%`} y1="0" x2={`${i*11}%`} y2="100%" stroke="#2d9b5a" strokeWidth="1"/>)}
              {[...Array(10)].map((_,i) => <line key={`h${i}`} x1="0" y1={`${i*11}%`} x2="100%" y2={`${i*11}%`} stroke="#2d9b5a" strokeWidth="1"/>)}
            </svg>

            {/* Kerala label */}
            <div style={{ position:'absolute',top:12,left:16,fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--canopy)',fontWeight:700,opacity:0.6,letterSpacing:'0.1em' }}>
              KERALA, INDIA
            </div>

            {/* District labels */}
            {KERALA_DISTRICTS.map(d => {
              const pos = toPercent(d.lat, d.lng);
              return (
                <div key={d.name} style={{ position:'absolute',left:`${pos.x}%`,top:`${pos.y}%`,transform:'translate(-50%,-50%)',pointerEvents:'none' }}>
                  <div style={{ fontSize:'0.6rem',color:'rgba(13,59,46,0.45)',fontWeight:600,whiteSpace:'nowrap',textAlign:'center' }}>{d.name}</div>
                </div>
              );
            })}

            {/* Activity markers */}
            {activitiesWithCoords.map((a, i) => {
              const pos = toPercent(a.location.coordinates[1], a.location.coordinates[0]);
              const cfg = ACTIVITY_CONFIG[a.type] || {};
              const isSelected = selected?._id === a._id;
              return (
                <div key={a._id} onClick={() => setSelected(isSelected ? null : a)}
                  title={`${a.title} – ${a.carbonSaved?.toFixed(1)} kg CO₂`}
                  style={{
                    position:'absolute', left:`${pos.x}%`, top:`${pos.y}%`,
                    transform:'translate(-50%,-50%)', cursor:'pointer',
                    zIndex:isSelected?20:10,
                    transition:'transform 0.15s ease'
                  }}>
                  <div style={{
                    width:isSelected?30:22, height:isSelected?30:22,
                    borderRadius:'50%', background:cfg.color||'var(--leaf)',
                    border:`2px solid white`, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:isSelected?'0.85rem':'0.65rem',
                    boxShadow:isSelected?`0 0 0 4px ${cfg.color}40, 0 4px 12px rgba(0,0,0,0.2)`:`0 2px 6px rgba(0,0,0,0.15)`,
                    transition:'all 0.15s ease'
                  }}>
                    {cfg.icon||'🌿'}
                  </div>
                </div>
              );
            })}

            {/* User location */}
            {userLoc && (() => {
              const pos = toPercent(userLoc.lat, userLoc.lng);
              return (
                <div style={{ position:'absolute',left:`${pos.x}%`,top:`${pos.y}%`,transform:'translate(-50%,-50%)',zIndex:30 }}>
                  <div style={{ width:14,height:14,borderRadius:'50%',background:'#1a7fa8',border:'3px solid white',boxShadow:'0 0 0 4px rgba(26,127,168,0.3)' }}/>
                </div>
              );
            })()}

            {loading && (
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.7)' }}>
                <div style={{ fontSize:'0.875rem',color:'var(--canopy)',fontWeight:600 }}>Loading activities…</div>
              </div>
            )}
          </div>

          {/* Selected popup */}
          {selected && (
            <div style={{ position:'absolute',bottom:16,left:16,right:16,background:'white',borderRadius:14,padding:'14px 18px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--cloud)',display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ width:40,height:40,borderRadius:10,background:ACTIVITY_CONFIG[selected.type]?.bg,color:ACTIVITY_CONFIG[selected.type]?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0 }}>
                {ACTIVITY_CONFIG[selected.type]?.icon||'🌿'}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.875rem' }}>{selected.title}</div>
                <div style={{ fontSize:'0.75rem',color:'var(--fog)',marginTop:2 }}>{selected.user?.name} · {selected.user?.district}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'1rem',fontWeight:800,color:'var(--leaf)',fontFamily:'JetBrains Mono' }}>{selected.carbonSaved?.toFixed(1)} kg</div>
                <div style={{ fontSize:'0.68rem',color:'var(--fog)' }}>CO₂ saved</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',color:'var(--fog)',cursor:'pointer',fontSize:'1.2rem',padding:4 }}>×</button>
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ background:'linear-gradient(135deg,#0d3b2e,#1a6b3c)',borderRadius:16,padding:'20px 18px',color:'white' }}>
            <div style={{ fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.1em',opacity:0.5,marginBottom:6 }}>Total CO₂ Impact</div>
            <div style={{ fontSize:'2rem',fontWeight:800,fontFamily:'JetBrains Mono',color:'#4cc97f' }}>{totalCarbon.toFixed(0)}</div>
            <div style={{ fontSize:'0.8rem',opacity:0.6 }}>kg CO₂ saved across Kerala</div>
          </div>

          {typeBreakdown.map(t => (
            <div key={t.type} style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:14,padding:'14px 16px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
                <span style={{ fontSize:'1.2rem' }}>{ACTIVITY_CONFIG[t.type]?.icon}</span>
                <span style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.85rem' }}>{ACTIVITY_CONFIG[t.type]?.label}</span>
                <span style={{ marginLeft:'auto',fontWeight:700,color:ACTIVITY_CONFIG[t.type]?.color,fontSize:'0.875rem' }}>{t.count}</span>
              </div>
              <div style={{ height:5,background:'var(--cloud)',borderRadius:99,overflow:'hidden' }}>
                <div style={{ width:`${totalCarbon>0?(t.carbon/totalCarbon)*100:0}%`,height:'100%',background:ACTIVITY_CONFIG[t.type]?.color,borderRadius:99 }}/>
              </div>
              <div style={{ fontSize:'0.72rem',color:'var(--fog)',marginTop:5 }}>{t.carbon.toFixed(0)} kg CO₂</div>
            </div>
          ))}

          <div style={{ background:'rgba(26,127,168,0.06)',border:'1px solid rgba(26,127,168,0.2)',borderRadius:14,padding:'14px 16px',fontSize:'0.8rem',color:'#1a7fa8' }}>
            <div style={{ fontWeight:700,marginBottom:4 }}>📍 GPS Verification</div>
            <p style={{ margin:0 }}>Only activities with verified GPS coordinates appear on the map. {activities.length - activitiesWithCoords.length} activities have no location data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
