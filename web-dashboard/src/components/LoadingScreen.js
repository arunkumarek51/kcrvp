import React from 'react';
import { TreePine, Zap } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0d3b2e 0%, #1a6b3c 60%, #0d3b2e 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px', zIndex: 9999
    }}>
      <div style={{
        position: 'relative', width: 72, height: 72,
        background: 'linear-gradient(135deg, #2d9b5a, #4cc97f)',
        borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(76,201,127,0.4)',
        animation: 'leafFloat 2s ease-in-out infinite'
      }}>
        <TreePine size={32} color="white" strokeWidth={2} />
        <Zap size={14} color="#e8a020" strokeWidth={3}
          style={{ position: 'absolute', bottom: 8, right: 8 }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          KCRVP
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
          Kerala Carbon Registry
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#4cc97f', opacity: 0.6,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
}
