import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '../context/AuthContext';
import { TreePine, Zap, Car, Wheat, MapPin, Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './SubmitActivity.css';

const ACTIVITY_TYPES = [
  {
    value: 'tree_planting', label: 'Tree Planting', icon: TreePine, color: '#2d9b5a',
    desc: 'Log trees you\'ve planted', unit: 'Trees Planted', placeholder: 'e.g. 10',
    rate: '22 kg CO₂ / tree / year', tip: 'Include all varieties: fruit, timber, shade trees'
  },
  {
    value: 'solar_energy', label: 'Solar Energy', icon: Zap, color: '#e8a020',
    desc: 'Solar panel kWh generated', unit: 'kWh Generated', placeholder: 'e.g. 150',
    rate: '0.85 kg CO₂ / kWh', tip: 'Check your inverter app for monthly generation data'
  },
  {
    value: 'ev_driving', label: 'EV Driving', icon: Car, color: '#1a7fa8',
    desc: 'Electric vehicle distance', unit: 'Kilometers Driven', placeholder: 'e.g. 500',
    rate: '0.12 kg CO₂ / km', tip: 'Compare to petrol vehicle of similar size'
  },
  {
    value: 'organic_farming', label: 'Organic Farming', icon: Wheat, color: '#7b4fd4',
    desc: 'Chemical-free farming land', unit: 'Acres Farmed', placeholder: 'e.g. 2.5',
    rate: '200 kg CO₂ / acre / year', tip: 'No synthetic fertilizers or pesticides required'
  },
];

const CARBON_RATES = { tree_planting: 22, solar_energy: 0.85, ev_driving: 0.12, organic_farming: 200 };

export default function SubmitActivity() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=type, 2=details, 3=location, 4=review
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', quantity: '' });
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState({ lat: '', lng: '', address: '', district: '' });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedType = ACTIVITY_TYPES.find(t => t.value === type);
  const carbonPreview = type && form.quantity ? (parseFloat(form.quantity) * CARBON_RATES[type]).toFixed(1) : null;
  const creditsPreview = carbonPreview ? (carbonPreview / 1000).toFixed(4) : null;

  // Dropzone
  const onDrop = useCallback(files => {
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) toast.error('Some files exceed 10MB limit');
    setPhotos(p => [...p, ...valid.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }))].slice(0, 5));
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 5 });

  // GPS
  const captureLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation(l => ({ ...l, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
        toast.success('Location captured! 📍');
      },
      () => { setLocating(false); toast.error('Could not get location'); },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!type) return toast.error('Select activity type');
    if (!form.quantity || isNaN(form.quantity)) return toast.error('Enter a valid quantity');
    if (photos.length === 0) return toast.error('Upload at least one photo');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('title', form.title || `${selectedType?.label} – ${new Date().toLocaleDateString('en-IN')}`);
      fd.append('description', form.description);
      fd.append('quantity', form.quantity);
      if (location.lat) fd.append('lat', location.lat);
      if (location.lng) fd.append('lng', location.lng);
      if (location.address) fd.append('address', location.address);
      if (location.district) fd.append('district', location.district);
      photos.forEach(p => fd.append('photos', p));

      const { data } = await api.post('/activities', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (result) {
    const act = result.activity;
    return (
      <div className="submit-success animate-scaleIn">
        <div className="success-icon"><CheckCircle size={52} strokeWidth={1.5} /></div>
        <h2>Activity Submitted! 🌿</h2>
        <p>Your green activity has been recorded and is pending verification.</p>
        <div className="success-stats">
          <div className="success-stat">
            <span className="ss-val">{act.carbonSaved?.toFixed(1)}</span>
            <span className="ss-lbl">kg CO₂ potential</span>
          </div>
          <div className="success-stat">
            <span className="ss-val">{act.carbonCreditsEarned?.toFixed(4)}</span>
            <span className="ss-lbl">credits to earn</span>
          </div>
          <div className="success-stat">
            <span className="ss-val">{result.aiVerification?.confidence || 0}%</span>
            <span className="ss-lbl">AI confidence</span>
          </div>
        </div>
        {result.aiVerification && (
          <div className="ai-result">
            <span className={`ai-status ${result.aiVerification.verificationStatus}`}>
              {result.aiVerification.verificationStatus === 'passed' ? '✅ AI Verified' : '⚠️ Needs Auditor Review'}
            </span>
            <p>{result.aiVerification.analysisDetails}</p>
          </div>
        )}
        {result.isDuplicate && (
          <div className="dup-warning"><AlertCircle size={16} /> Nearby similar activity detected. An auditor will review your submission.</div>
        )}
        <div className="success-actions">
          <button className="success-btn primary" onClick={() => navigate('/activities')}>View My Activities</button>
          <button className="success-btn secondary" onClick={() => { setResult(null); setStep(1); setType(null); setForm({ title:'', description:'', quantity:'' }); setPhotos([]); setLocation({ lat:'',lng:'',address:'',district:'' }); }}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page animate-fadeIn">
      <div className="submit-header">
        <h2>Log Green Activity</h2>
        <p>Submit verified climate actions to earn carbon credits</p>
      </div>

      {/* Steps indicator */}
      <div className="steps-bar">
        {['Activity Type', 'Details & Photos', 'Location', 'Review'].map((s, i) => (
          <div key={i} className={`step ${step > i+1 ? 'done' : step === i+1 ? 'active' : ''}`}>
            <div className="step-circle">{step > i+1 ? '✓' : i+1}</div>
            <span className="step-label">{s}</span>
            {i < 3 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="submit-body">
        {/* Step 1: Type */}
        {step === 1 && (
          <div className="step-content">
            <h3>What activity are you logging?</h3>
            <div className="type-grid">
              {ACTIVITY_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <div key={t.value} className={`type-card ${type === t.value ? 'selected' : ''}`}
                    style={{ '--type-color': t.color }} onClick={() => setType(t.value)}>
                    <div className="type-icon" style={{ background: `${t.color}18`, color: t.color }}>
                      <Icon size={28} strokeWidth={1.8} />
                    </div>
                    <h4>{t.label}</h4>
                    <p>{t.desc}</p>
                    <div className="type-rate">{t.rate}</div>
                  </div>
                );
              })}
            </div>
            <button className="next-btn" disabled={!type} onClick={() => setStep(2)}>Continue →</button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && selectedType && (
          <div className="step-content">
            <div className="step-hint">
              <div className="hint-icon" style={{ background: `${selectedType.color}18`, color: selectedType.color }}>
                <selectedType.icon size={20} />
              </div>
              <div>
                <strong>{selectedType.label}</strong>
                <span>{selectedType.tip}</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label>Activity Title (optional)</label>
                <input placeholder={`e.g. ${selectedType.label} in my village`} value={form.title} onChange={e => set('title', e.target.value)} />
              </div>

              <div className="field-group">
                <label>{selectedType.unit} *</label>
                <div className="quantity-wrap">
                  <input type="number" min="0" placeholder={selectedType.placeholder} value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                  {carbonPreview && (
                    <div className="carbon-preview">
                      <span className="cp-val">~{carbonPreview} kg CO₂</span>
                      <span className="cp-cred">{creditsPreview} credits</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group full-width">
                <label>Description</label>
                <textarea rows={3} placeholder="Briefly describe your activity…" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              <div className="field-group full-width">
                <label>Photo Proof * <span className="field-hint">Upload 1–5 photos as evidence</span></label>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <Upload size={28} style={{ color: 'var(--fog)' }} />
                  <p>{isDragActive ? 'Drop photos here…' : 'Drag photos or click to browse'}</p>
                  <small>JPG, PNG, WEBP up to 10MB each (max 5)</small>
                </div>
                {photos.length > 0 && (
                  <div className="photo-previews">
                    {photos.map((p, i) => (
                      <div key={i} className="photo-thumb">
                        <img src={p.preview} alt="" />
                        <button onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="next-btn" disabled={!form.quantity} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="step-content">
            <h3>Where did this activity happen?</h3>
            <p style={{ color: 'var(--fog)', marginBottom: 24 }}>GPS verification helps prevent duplicate submissions and builds trust.</p>

            <div className="location-capture">
              <button className={`gps-btn ${locating ? 'locating' : ''}`} onClick={captureLocation} disabled={locating}>
                {locating ? <Loader size={18} className="animate-spin" /> : <MapPin size={18} />}
                {locating ? 'Getting location…' : location.lat ? 'Update Location' : 'Capture GPS Location'}
              </button>
              {location.lat && (
                <div className="gps-result">
                  <MapPin size={14} style={{ color: 'var(--leaf)' }} />
                  <span>{location.lat}, {location.lng}</span>
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label>Address (optional)</label>
                <input placeholder="Village, Panchayat" value={location.address} onChange={e => setLocation(l => ({ ...l, address: e.target.value }))} />
              </div>
              <div className="field-group">
                <label>District</label>
                <select value={location.district} onChange={e => setLocation(l => ({ ...l, district: e.target.value }))}>
                  <option value="">Select district</option>
                  {['Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam','Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="next-btn" onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && selectedType && (
          <div className="step-content">
            <h3>Review & Submit</h3>
            <div className="review-card">
              <div className="review-row"><span>Activity Type</span><strong>{selectedType.label}</strong></div>
              <div className="review-row"><span>Quantity</span><strong>{form.quantity} {selectedType.unit}</strong></div>
              <div className="review-row"><span>Carbon Estimate</span><strong style={{ color: 'var(--leaf)' }}>~{carbonPreview} kg CO₂</strong></div>
              <div className="review-row"><span>Credits to Earn</span><strong style={{ color: 'var(--gold)' }}>{creditsPreview} credits</strong></div>
              <div className="review-row"><span>Photos</span><strong>{photos.length} uploaded</strong></div>
              <div className="review-row"><span>GPS</span><strong>{location.lat ? '📍 Captured' : 'Not provided'}</strong></div>
              {location.district && <div className="review-row"><span>District</span><strong>{location.district}</strong></div>}
            </div>

            <div className="ai-info">
              <span>🤖 Your photo will be analyzed by AI for verification. An auditor may also review your submission before credits are issued.</span>
            </div>

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(3)}>← Back</button>
              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader size={16} className="animate-spin" /> Submitting…</> : '🌱 Submit Activity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
