import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { useManager } from '../../context/ManagerContext';

export const ManagerLogin = () => {
  const { manager, token, login } = useManager();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (manager && token) {
      navigate('/manager/dashboard', { replace: true });
    }
  }, [manager, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter both your manager email/username and password.');
      return;
    }

    setLoading(true);
    const res = await login(identifier.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/manager/dashboard');
    } else {
      setError(res.message || 'Invalid manager credentials. Please check your credentials and try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-obsidian-charcoal)',
      backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(140, 38, 53, 0.18) 0%, transparent 60%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--color-charcoal-secondary)',
        border: '1px solid var(--color-subtle-border)',
        borderRadius: '4px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            letterSpacing: '0.2em',
            color: 'var(--color-warm-ivory)',
            margin: 0,
            lineHeight: 1.2
          }}>
            AROHVI
          </h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.6rem',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-muted-champagne)',
            backgroundColor: 'rgba(217, 185, 155, 0.08)',
            padding: '0.3rem 0.8rem',
            borderRadius: '2px',
            border: '1px solid rgba(217, 185, 155, 0.2)'
          }}>
            <ShieldCheck size={13} />
            <span>Management & Founder Portal</span>
          </div>
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--color-warm-ivory-dim)',
            marginTop: '0.9rem',
            lineHeight: 1.5
          }}>
            Sign in with administrative credentials to manage products, pricing, stock, images, and orders.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(140, 38, 53, 0.25)',
            border: '1px solid var(--color-ruby-red)',
            padding: '0.8rem 1rem',
            borderRadius: '2px',
            color: '#fca5a5',
            fontSize: '0.84rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={13} />
              <span>Email or Username</span>
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="manager@arohvi.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem' }}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={13} />
              <span>Manager Password</span>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem' }}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.95rem',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              letterSpacing: '0.12em'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Manager Portal'}
          </button>
        </form>

        {/* Back to Customer Site */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-subtle-border)',
          textAlign: 'center'
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-warm-ivory-dim)',
              fontSize: '0.82rem',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-muted-champagne)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-warm-ivory-dim)'}
          >
            <ArrowLeft size={13} />
            <span>Return to Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
