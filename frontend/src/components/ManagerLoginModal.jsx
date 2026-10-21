import React, { useState } from 'react';
import { X, Lock, ShieldCheck, User } from 'lucide-react';
import { useManager } from '../context/ManagerContext';

export const ManagerLoginModal = ({ isOpen, onClose }) => {
  const { login } = useManager();
  const [identifier, setIdentifier] = useState('tulsi@arohvi.in');
  const [password, setPassword] = useState('arohvi2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemo = async () => {
    setIdentifier('tulsi@arohvi.in');
    setPassword('arohvi2026');
    setLoading(true);
    const res = await login('tulsi@arohvi.in', 'arohvi2026');
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="checkout-modal-card" style={{ maxWidth: '440px' }}>
        <div className="reveal-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={18} color="var(--color-muted-champagne)" />
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-warm-ivory)', fontWeight: 600 }}>
              Founder & Manager Portal
            </span>
          </div>

          <button 
            className="reveal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-warm-ivory-dim)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Access store administration, inventory control, real-time orders, website content, and analytics.
          </p>

          {error && (
            <div style={{ backgroundColor: 'rgba(140, 38, 53, 0.25)', border: '1px solid var(--color-ruby-red)', padding: '0.75rem', borderRadius: '2px', color: '#f87171', fontSize: '0.84rem', marginBottom: '1.2rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">Manager Identifier / Email</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.9rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In as Manager'}
            </button>

            <button 
              type="button"
              className="btn-secondary"
              style={{ width: '100%', borderColor: 'var(--color-muted-champagne)', color: 'var(--color-muted-champagne)' }}
              onClick={handleQuickDemo}
            >
              ⚡ 1-Click Demo Login (Tulsi Prakash)
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.76rem', color: 'var(--color-warm-ivory-dim)', borderTop: '1px solid var(--color-subtle-border)', paddingTop: '1rem' }}>
            Default Creds: <code style={{ color: 'var(--color-muted-champagne)' }}>tulsi@arohvi.in</code> / <code style={{ color: 'var(--color-muted-champagne)' }}>arohvi2026</code>
          </div>
        </div>
      </div>
    </div>
  );
};
