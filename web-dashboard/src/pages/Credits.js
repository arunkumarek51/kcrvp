import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Link as LinkIcon, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const TX_ICONS = {
  credit_earned: { icon: Plus,           color:'#2d9b5a', bg:'rgba(45,155,90,0.1)',  label:'Earned' },
  credit_sold:   { icon: ArrowUpRight,   color:'#1a7fa8', bg:'rgba(26,127,168,0.1)', label:'Sold' },
  credit_bought: { icon: ArrowDownLeft,  color:'#7b4fd4', bg:'rgba(123,79,212,0.1)', label:'Bought' },
  credit_retired:{ icon: CreditCard,     color:'#e8a020', bg:'rgba(232,160,32,0.1)', label:'Retired' },
};

export default function Credits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null); // credit being listed
  const [listForm, setListForm] = useState({ price: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/credits/my');
        setCredits(data.credits || []);
        setTransactions(data.transactions || []);
      } catch(e) { toast.error('Failed to load credits'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleList = async () => {
    if (!listForm.price || !listForm.amount) return toast.error('Enter price and amount');
    if (parseFloat(listForm.amount) > listing.amount) return toast.error('Amount exceeds available credits');
    setSubmitting(true);
    try {
      await api.post('/marketplace/list', {
        creditId: listing._id,
        creditAmount: listForm.amount,
        pricePerCredit: listForm.price,
        description: `Verified Kerala carbon credit from ${listing.activity?.type?.replace('_',' ') || 'green activity'}`
      });
      toast.success('Listed on marketplace! 🎉');
      setListing(null);
      const { data } = await api.get('/credits/my');
      setCredits(data.credits || []);
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to list'); }
    finally { setSubmitting(false); }
  };

  const totalCredits = credits.filter(c => c.status === 'active').reduce((s,c) => s+c.amount, 0);
  const totalCo2 = credits.reduce((s,c) => s+c.co2Equivalent, 0);

  if (loading) return <div style={{ display:'flex',flexDirection:'column',gap:12 }}>{[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:80 }}/>)}</div>;

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:24 }} className="animate-fadeIn">
      <div><h2 style={{ color:'var(--forest)' }}>Carbon Credits Wallet</h2><p style={{ color:'var(--fog)' }}>Manage and sell your verified carbon credits</p></div>

      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
        {[
          { label:'Active Credits', value:totalCredits.toFixed(4), color:'var(--leaf)', bg:'rgba(45,155,90,0.1)' },
          { label:'CO₂ Equivalent', value:`${totalCo2.toFixed(0)} kg`, color:'#1a7fa8', bg:'rgba(26,127,168,0.1)' },
          { label:'Wallet Balance', value:`₹${(user?.walletBalance||0).toLocaleString('en-IN')}`, color:'var(--gold)', bg:'rgba(232,160,32,0.1)' },
        ].map((s,i) => (
          <div key={i} style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'20px 22px',borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:'1.6rem',fontWeight:800,color:'var(--forest)',fontFamily:'JetBrains Mono' }}>{s.value}</div>
            <div style={{ fontSize:'0.75rem',color:'var(--fog)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Credits list */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'22px 24px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
          <h4 style={{ color:'var(--forest)' }}>My Carbon Credits</h4>
          <button onClick={() => navigate('/marketplace')} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'1.5px solid var(--cloud)',borderRadius:10,padding:'7px 14px',fontSize:'0.82rem',fontWeight:600,color:'var(--ash)',cursor:'pointer' }}>
            <ShoppingBag size={14}/> View Marketplace
          </button>
        </div>
        {credits.length === 0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',color:'var(--fog)' }}>
            <CreditCard size={40} style={{ color:'var(--cloud)',marginBottom:12 }}/>
            <p>No credits yet. Submit and get activities approved to earn credits.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {credits.map(c => (
              <div key={c._id} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 14px',borderRadius:12,border:'1px solid var(--cloud)',background:c.status==='listed'?'rgba(26,127,168,0.04)':'var(--ivory)' }}>
                <div style={{ width:44,height:44,background:'rgba(45,155,90,0.1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <CreditCard size={20} style={{ color:'var(--canopy)' }}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,color:'var(--charcoal)',fontSize:'0.875rem' }}>
                    {c.creditId || c.serialNumber || 'KCRVP Credit'}
                  </div>
                  <div style={{ fontSize:'0.72rem',color:'var(--fog)',marginTop:2 }}>
                    {c.activity?.type?.replace('_',' ')||'Activity'} · Vintage {c.vintage} · Issued {new Date(c.issuedAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign:'center',padding:'0 12px' }}>
                  <div style={{ fontSize:'1.1rem',fontWeight:800,color:'var(--leaf)',fontFamily:'JetBrains Mono' }}>{c.amount.toFixed(4)}</div>
                  <div style={{ fontSize:'0.65rem',color:'var(--fog)' }}>credits</div>
                </div>
                <span style={{
                  padding:'3px 10px',borderRadius:99,fontSize:'0.72rem',fontWeight:600,
                  background:c.status==='active'?'rgba(45,155,90,0.1)':c.status==='listed'?'rgba(26,127,168,0.1)':'rgba(232,160,32,0.1)',
                  color:c.status==='active'?'var(--leaf)':c.status==='listed'?'#1a7fa8':'var(--gold)'
                }}>{c.status}</span>
                {c.isOnChain ? (
                  <span style={{ fontSize:'0.7rem',color:'#7b4fd4',display:'flex',alignItems:'center',gap:3 }}><LinkIcon size={12}/>On-chain</span>
                ) : null}
                {c.status === 'active' && (
                  <button onClick={() => { setListing(c); setListForm({ price:'900', amount:c.amount.toFixed(4) }); }}
                    style={{ background:'var(--canopy)',color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' }}>
                    List for Sale
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div style={{ background:'white',border:'1px solid var(--cloud)',borderRadius:16,padding:'22px 24px' }}>
        <h4 style={{ color:'var(--forest)',marginBottom:16 }}>Transaction History</h4>
        {transactions.length === 0 ? (
          <p style={{ color:'var(--fog)',fontSize:'0.875rem',textAlign:'center',padding:'24px' }}>No transactions yet.</p>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {transactions.map(tx => {
              const txc = TX_ICONS[tx.type] || TX_ICONS.credit_earned;
              const TxIcon = txc.icon;
              return (
                <div key={tx._id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--ivory)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ width:36,height:36,borderRadius:10,background:txc.bg,color:txc.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <TxIcon size={16}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)' }}>{tx.description || txc.label}</div>
                    <div style={{ fontSize:'0.72rem',color:'var(--fog)' }}>
                      {tx.counterparty ? `↔ ${tx.counterparty.name}` : ''} · {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  {tx.amount && <div style={{ fontSize:'0.9rem',fontWeight:700,color:txc.color,fontFamily:'JetBrains Mono' }}>
                    {tx.type==='credit_earned'?'+':'-'}{tx.amount.toFixed(4)} cr
                  </div>}
                  {tx.value && <div style={{ fontSize:'0.85rem',color:'var(--ash)',fontFamily:'JetBrains Mono' }}>₹{tx.value.toLocaleString('en-IN')}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* List modal */}
      {listing && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,59,46,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}>
          <div className="animate-scaleIn" style={{ background:'white',borderRadius:20,padding:'32px',width:'100%',maxWidth:420,margin:'20px' }}>
            <h3 style={{ color:'var(--forest)',marginBottom:8 }}>List Credits for Sale</h3>
            <p style={{ color:'var(--fog)',fontSize:'0.875rem',marginBottom:24 }}>Set price and quantity to list on the marketplace.</p>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div><label style={{ fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)',display:'block',marginBottom:6 }}>Amount (max {listing.amount.toFixed(4)})</label>
                <input type="number" max={listing.amount} step="0.0001" value={listForm.amount} onChange={e=>setListForm(f=>({...f,amount:e.target.value}))}/>
              </div>
              <div><label style={{ fontSize:'0.85rem',fontWeight:600,color:'var(--charcoal)',display:'block',marginBottom:6 }}>Price per Credit (₹)</label>
                <input type="number" min="1" placeholder="e.g. 900" value={listForm.price} onChange={e=>setListForm(f=>({...f,price:e.target.value}))}/>
              </div>
              {listForm.price && listForm.amount && (
                <div style={{ background:'var(--ivory)',borderRadius:10,padding:'12px 16px',fontSize:'0.85rem',color:'var(--ash)' }}>
                  Total listing value: <strong style={{ color:'var(--forest)' }}>₹{(parseFloat(listForm.price)*parseFloat(listForm.amount)).toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
            <div style={{ display:'flex',gap:12,marginTop:24 }}>
              <button onClick={()=>setListing(null)} style={{ flex:1,padding:'12px',background:'none',border:'1.5px solid var(--cloud)',borderRadius:12,fontWeight:600,cursor:'pointer',color:'var(--ash)' }}>Cancel</button>
              <button onClick={handleList} disabled={submitting} style={{ flex:1,padding:'12px',background:'linear-gradient(135deg,#1a6b3c,#2d9b5a)',color:'white',border:'none',borderRadius:12,fontWeight:600,cursor:'pointer' }}>
                {submitting ? 'Listing…' : 'List Now →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
