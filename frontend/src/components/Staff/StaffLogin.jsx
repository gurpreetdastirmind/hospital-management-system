// frontend/src/components/staff/StaffLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StaffLogin.css';
import api from '../../api';
const StaffLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store session
        localStorage.setItem('staffLoggedIn', 'true');
        localStorage.setItem('staffEmail', email);
        localStorage.setItem('staffName', data.data.name);
        localStorage.setItem('staffRole', data.data.role);
        
        // Redirect to dashboard
        navigate('/staff/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-card">
        <div className="login-header">
          <div className="hospital-icon">🏥</div>
          <h1>Civil Hospital</h1>
          <p className="subtitle">Staff Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              'Login to Staff Portal'
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="back-link">← Back to Patient App</a>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;