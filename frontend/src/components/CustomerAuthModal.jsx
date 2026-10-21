import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, MapPin, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CustomerAuthModal = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode, 
    login, 
    register 
  } = useCustomerAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Authentication failed. Please verify your credentials.');
    } else {
      handleClose();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regData.name.trim() || !regData.email.trim() || !regData.password) {
      setErrorMsg('Please fill in your name, email, and a secure password.');
      return;
    }

    if (regData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await register(regData);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed. Please try again.');
    } else {
      handleClose();
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div 
        className="checkout-modal-card" 
        style={{ 
          maxWidth: '460px',
          border: '1px solid var(--color-subtle-border)',
          backgroundColor: 'var(--color-charcoal-secondary)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div className="reveal-panel-header" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={16} color="var(--color-muted-champagne)" />
            <span style={{ 
              fontSize: '0.85rem', 
              letterSpacing: '0.14em', 
              textTransform: 'uppercase', 
              color: 'var(--color-warm-ivory)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600
            }}>
              {authModalMode === 'login' ? 'Customer Sign In' : 'Join AROHVI'}
            </span>
          </div>

          <button 
            className="reveal-close-btn"
            onClick={handleClose}
            aria-label="Close authentication modal"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          borderBottom: '1px solid var(--color-subtle-border)',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <button
            type="button"
            onClick={() => { setAuthModalMode('login'); setErrorMsg(''); }}
            style={{
              padding: '0.9rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: authModalMode === 'login' ? '2px solid var(--color-ruby-red)' : '2px solid transparent',
              color: authModalMode === 'login' ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)',
              fontSize: '0.82rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: authModalMode === 'login' ? 600 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthModalMode('register'); setErrorMsg(''); }}
            style={{
              padding: '0.9rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: authModalMode === 'register' ? '2px solid var(--color-ruby-red)' : '2px solid transparent',
              color: authModalMode === 'register' ? 'var(--color-warm-ivory)' : 'var(--color-warm-ivory-dim)',
              fontSize: '0.82rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: authModalMode === 'register' ? 600 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem 1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Subheading */}
          <p style={{ 
            fontSize: '0.84rem', 
            color: 'var(--color-warm-ivory-dim)', 
            marginBottom: '1.25rem',
            lineHeight: '1.5'
          }}>
            {authModalMode === 'login' 
              ? 'Access your saved addresses, track your adornment orders, and enjoy express checkout.' 
              : 'Create your personal account to save shipping details and follow your orders.'}
          </p>

          {/* Error Alert */}
          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(140, 38, 53, 0.25)',
              border: '1px solid var(--color-ruby-red)',
              padding: '0.75rem 1rem',
              borderRadius: '2px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authModalMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={13} />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={13} />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  marginTop: '0.4rem',
                  fontSize: '0.85rem',
                  letterSpacing: '0.12em'
                }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-warm-ivory-dim)' }}>
                  New to AROHVI?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('register'); setErrorMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted-champagne)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Create an account
                </button>
              </div>
            </form>
          ) : (
            /* CREATE ACCOUNT FORM */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={13} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Deshmukh"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={13} />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={13} />
                  <span>Phone Number (for Courier & Tracking)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={13} />
                  <span>Password (min. 6 characters)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={13} />
                  <span>Default Shipping Address (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Flat / House / Street Address"
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={regData.city}
                    onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    value={regData.pincode}
                    onChange={(e) => setRegData({ ...regData, pincode: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.88rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  marginTop: '0.4rem',
                  fontSize: '0.85rem',
                  letterSpacing: '0.12em'
                }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-warm-ivory-dim)' }}>
                  Already have an account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('login'); setErrorMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted-champagne)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
