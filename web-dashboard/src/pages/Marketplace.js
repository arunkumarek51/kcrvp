import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Filter, TrendingUp, Leaf, Award, Building2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './Marketplace.css';

const ROLE_ICONS = { citizen:'🧑', farmer:'🌾', auditor:'🔍', company:'🏢', admin:'⚡' };
const TYPE_COLORS = { tree_planting:'#2d9b5a', solar_energy:'#e8a020', ev_driving:'#1a7fa8', organic_farming:'#7b4fd4' };

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ minPrice: '', maxPrice: '' });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (filter.minPrice) params.append('minPrice', filter.minPrice);
      if (filter.maxPrice) params.append('maxPrice', filter.maxPrice);
      const { data } = await api.get(`/marketplace/listings?${params}`);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error('Failed to load marketplace'); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleBuy = async (listing) => {
    if (user.walletBalance < listing.totalPrice) {
      return toast.error(`Insufficient balance. You need ₹${listing.totalPrice.toLocaleString()} but have ₹${user.walletBalance.toLocaleString()}`);
    }
    if (!window.confirm(`Buy ${listing.creditAmount.toFixed(4)} credits for ₹${listing.totalPrice.toLocaleString('en-IN')}?`)) return;
    setBuying(listing._id);
    try {
      const { data } = await api.post(`/marketplace/buy/${listing._id}`);
      toast.success(`✅ Purchased ${data.transaction.amount.toFixed(4)} carbon credits for ₹${data.transaction.value.toLocaleString('en-IN')}`);
      fetchListings();
    } catch (err) { toast.error(err.response?.data?.message || 'Purchase failed'); }
    finally { setBuying(null); }
  };

  const handleCancel = async (listingId) => {
    if (!window.confirm('Cancel this listing?')) return;
    try {
      await api.delete(`/marketplace/cancel/${listingId}`);
      toast.success('Listing cancelled');
      fetchListings();
    } catch (err) { toast.error('Failed to cancel'); }
  };

  return (
    <div className="marketplace animate-fadeIn">
      <div className="market-header">
        <div>
          <h2>Carbon Marketplace</h2>
          <p style={{ color: 'var(--fog)', marginTop: 4 }}>{total} listings available · Buy verified Kerala carbon credits</p>
        </div>
        <div className="market-balance">
          <span className="bal-label">Your Wallet</span>
          <span className="bal-val">₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="market-filters">
        <div className="filter-group">
          <Filter size={14} />
          <span>Price range (₹/credit):</span>
          <input type="number" placeholder="Min" value={filter.minPrice} onChange={e => setFilter(f => ({ ...f, minPrice: e.target.value }))} style={{ width: 80 }} />
          <span>–</span>
          <input type="number" placeholder="Max" value={filter.maxPrice} onChange={e => setFilter(f => ({ ...f, maxPrice: e.target.value }))} style={{ width: 80 }} />
          <button className="filter-apply-btn" onClick={fetchListings}>Apply</button>
        </div>
        <div className="market-stats-strip">
          <span><TrendingUp size={12} /> Market avg: <strong>₹900/credit</strong></span>
          <span><Award size={12} /> Standard: <strong>KCRVP-V1</strong></span>
          <span><Leaf size={12} /> 1 credit = <strong>1,000 kg CO₂</strong></span>
        </div>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="listings-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="market-empty">
          <ShoppingBag size={48} style={{ color: 'var(--cloud)' }} />
          <h3>No listings yet</h3>
          <p>Be the first to list carbon credits for sale</p>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map(listing => {
            const actType = listing.credit?.activity?.type;
            const accentColor = TYPE_COLORS[actType] || '#2d9b5a';
            const isOwn = listing.seller?._id === user?._id;
            return (
              <div key={listing._id} className="listing-card" style={{ '--accent': accentColor }}>
                <div className="listing-top" style={{ background: `${accentColor}10`, borderBottom: `1px solid ${accentColor}20` }}>
                  <div className="listing-seller">
                    <div className="seller-avatar">{ROLE_ICONS[listing.seller?.role] || '🌿'}</div>
                    <div className="seller-info">
                      <span className="seller-name">{listing.seller?.companyName || listing.seller?.name}</span>
                      <span className="seller-loc">📍 {listing.seller?.district || 'Kerala'}</span>
                    </div>
                  </div>
                  <div className="listing-type-badge" style={{ background: `${accentColor}20`, color: accentColor }}>
                    {actType?.replace('_', ' ') || 'Carbon Credit'}
                  </div>
                </div>

                <div className="listing-body">
                  <div className="listing-credits">
                    <span className="credit-amount">{listing.creditAmount.toFixed(4)}</span>
                    <span className="credit-unit">carbon credits</span>
                    <span className="co2-eq">≈ {(listing.creditAmount * 1000).toFixed(0)} kg CO₂</span>
                  </div>

                  <div className="listing-pricing">
                    <div className="price-per">
                      <span className="price-val">₹{listing.pricePerCredit.toLocaleString('en-IN')}</span>
                      <span className="price-unit">per credit</span>
                    </div>
                    <div className="price-total">Total: <strong>₹{listing.totalPrice.toLocaleString('en-IN')}</strong></div>
                  </div>

                  {listing.description && (
                    <p className="listing-desc">{listing.description}</p>
                  )}

                  <div className="listing-meta">
                    <span>🏷️ {listing.credit?.serialNumber || 'KCRVP-CERT'}</span>
                    <span>📅 {new Date(listing.listedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="listing-actions">
                  {isOwn ? (
                    <button className="cancel-btn" onClick={() => handleCancel(listing._id)}>Cancel Listing</button>
                  ) : (
                    <button
                      className="buy-btn"
                      style={{ background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})` }}
                      onClick={() => handleBuy(listing)}
                      disabled={buying === listing._id || user?.role === 'farmer'}
                    >
                      {buying === listing._id ? <Loader size={14} className="animate-spin" /> : <Building2 size={14} />}
                      {buying === listing._id ? 'Processing…' : 'Buy Credits'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / 12)}</span>
          <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
