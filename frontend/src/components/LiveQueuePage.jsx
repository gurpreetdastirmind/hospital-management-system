// frontend/src/components/LiveQueuePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App.jsx';
import api from '../api';
import '../styles/LiveQueuePage.css';

const LiveQueuePage = () => {
  const navigate = useNavigate();
  const { language, translations } = useContext(LanguageContext);
  const [departments, setDepartments] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Hospital details with 24/7 availability
  const hospitalDetails = {
    name: 'Civil Hospital',
    address: '123 Healthcare Boulevard, Medical District, City - 400001',
    phone: '+91 22 2345 6789',
    emergency: '+91 98765 43210',
    ambulance: '+91 98765 43211',
    email: 'info@civilhospital.com',
    website: 'www.civilhospital.com',
    is24_7: true,
    emergencyServices: [
      '🚑 24/7 Emergency Room',
      '🏥 Trauma Center',
      '💉 ICU - Intensive Care Unit',
      '🚨 Ambulance Service',
      '🫀 Cardiac Care Unit',
      '🧠 Neurology Emergency'
    ],
    facilities: [
      '🏥 500+ Bed Capacity',
      '🩺 200+ Doctors',
      '🔬 Advanced Diagnostics',
      '💊 24/7 Pharmacy',
      '🧪 Laboratory Services',
      '📊 Digital X-Ray',
      '🧠 MRI & CT Scan',
      '🫀 Cardiac Cath Lab'
    ]
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsRes, tokensRes] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/tokens')
      ]);

      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
      if (tokensRes.data.success) {
        setTokens(tokensRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWaitingCount = (deptName) => {
    return tokens.filter(t => 
      t.department === deptName && 
      t.status === 'waiting'
    ).length;
  };

  const getTotalWaiting = () => {
    return tokens.filter(t => t.status === 'waiting').length;
  };

  const getTotalCalled = () => {
    return tokens.filter(t => t.status === 'called').length;
  };

  const getTotalCompleted = () => {
    return tokens.filter(t => t.status === 'completed').length;
  };

  const getDepartmentColor = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#4a90d9';
  };

  const getDepartmentRoom = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.room || 'N/A';
  };

  const getLatestToken = (deptName) => {
    const deptTokens = tokens.filter(t => 
      t.department === deptName && 
      (t.status === 'waiting' || t.status === 'called')
    );
    return deptTokens.length > 0 ? deptTokens[0] : null;
  };

  const handleDepartmentClick = (deptName) => {
    setSelectedDepartment(deptName);
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  const handleCallEmergency = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const filteredDepartments = selectedDepartment === 'all' 
    ? departments 
    : departments.filter(d => d.name === selectedDepartment);

  const activeDepartments = departments.filter(d => d.is_open === 1);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="live-queue-page">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-time">{formatTime(currentTime)}</span>
        <span className="status-date">{formatDate(currentTime)}</span>
        <span className="status-weather">32°C • Light rain</span>
        <span className="status-lang">ENG | US</span>
      </div>

      {/* Header with Hospital Info */}
      <div className="hospital-header">
        <div className="hospital-header-top">
          <div className="hospital-brand">
            <div className="hospital-icon-container">
              <span className="hospital-icon">🏥</span>
            </div>
            <div className="hospital-title">
              <h1>{hospitalDetails.name}</h1>
              <p className="hospital-tagline">⭐ Excellence in Healthcare Since 1950</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="back-btn" onClick={handleBackToApp}>
              ← Back to App
            </button>
          </div>
        </div>

        {/* Hospital Info Cards */}
        <div className="hospital-info-grid">
          <div className="info-card emergency-card" onClick={() => handleCallEmergency(hospitalDetails.emergency)}>
            <div className="info-card-icon">📞</div>
            <div className="info-card-content">
              <span className="info-card-label">EMERGENCY</span>
              <span className="info-card-value emergency">{hospitalDetails.emergency}</span>
              <span className="info-card-action">📱 Tap to Call</span>
            </div>
          </div>

          <div className="info-card availability-card">
            <div className="info-card-icon">🕐</div>
            <div className="info-card-content">
              <span className="info-card-label">AVAILABILITY</span>
              <span className="info-card-value available">24/7 Available</span>
              <span className="info-card-sub">Always Open</span>
            </div>
          </div>

          <div className="info-card ambulance-card" onClick={() => handleCallEmergency(hospitalDetails.ambulance)}>
            <div className="info-card-icon">🚑</div>
            <div className="info-card-content">
              <span className="info-card-label">AMBULANCE</span>
              <span className="info-card-value">{hospitalDetails.ambulance}</span>
              <span className="info-card-action">📱 Tap to Call</span>
            </div>
          </div>

          <div className="info-card location-card">
            <div className="info-card-icon">📍</div>
            <div className="info-card-content">
              <span className="info-card-label">LOCATION</span>
              <span className="info-card-value">{hospitalDetails.address}</span>
              <span className="info-card-sub">View on Map</span>
            </div>
          </div>
        </div>

        {/* Emergency Services */}
        <div className="emergency-services">
          <div className="emergency-header">
            <span className="emergency-icon">🚨</span>
            <span className="emergency-title">Emergency Services</span>
          </div>
          <div className="emergency-grid">
            {hospitalDetails.emergencyServices.map((service, index) => (
              <span key={index} className="emergency-tag">{service}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Live Queue Section */}
      <div className="queue-section">
        <div className="queue-section-header">
          <div className="queue-title">
            <h2>📋 Live Token Queue</h2>
            <span className="live-indicator">● Live</span>
          </div>
          <div className="queue-stats">
            <span className="stat-badge waiting">
              🟡 {getTotalWaiting()} Waiting
            </span>
            <span className="stat-badge called">
              🔵 {getTotalCalled()} Called
            </span>
            <span className="stat-badge completed">
              🟢 {getTotalCompleted()} Completed
            </span>
            <span className="stat-badge total">
              📊 {tokens.length} Total
            </span>
          </div>
        </div>

        {/* Department Filter */}
        <div className="department-filter">
          <button
            className={`filter-btn ${selectedDepartment === 'all' ? 'active' : ''}`}
            onClick={() => handleDepartmentClick('all')}
          >
            🏥 All
          </button>
          {activeDepartments.map(dept => {
            const waiting = getWaitingCount(dept.name);
            const color = getDepartmentColor(dept.name);
            return (
              <button
                key={dept.id}
                className={`filter-btn ${selectedDepartment === dept.name ? 'active' : ''}`}
                onClick={() => handleDepartmentClick(dept.name)}
                style={{ 
                  borderColor: selectedDepartment === dept.name ? color : '#e8ecf0',
                  backgroundColor: selectedDepartment === dept.name ? color : 'transparent',
                  color: selectedDepartment === dept.name ? 'white' : '#333'
                }}
              >
                {dept.icon || '🏥'} {dept.name} ({waiting})
              </button>
            );
          })}
        </div>

        {/* Department Cards */}
        <div className="department-cards-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading queue data...</p>
            </div>
          ) : (
            filteredDepartments.filter(d => d.is_open === 1).map(dept => {
              const waitingCount = getWaitingCount(dept.name);
              const latestToken = getLatestToken(dept.name);
              const color = getDepartmentColor(dept.name);
              const room = getDepartmentRoom(dept.name);

              return (
                <div key={dept.id} className="dept-card" style={{ borderLeftColor: color }}>
                  <div className="dept-card-header">
                    <div className="dept-card-info">
                      <div className="dept-icon-circle" style={{ backgroundColor: color }}>
                        <span>{dept.icon || '🏥'}</span>
                      </div>
                      <div>
                        <h3>{dept.name}</h3>
                        <span className="dept-room">🏠 {room}</span>
                      </div>
                    </div>
                    <span className={`dept-status ${dept.is_open === 1 ? 'open' : 'closed'}`}>
                      {dept.is_open === 1 ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </div>

                  <div className="dept-card-body">
                    <div className="dept-waiting">
                      <span className="waiting-number">{waitingCount}</span>
                      <span className="waiting-label">Waiting</span>
                    </div>
                    <div className="dept-current-token">
                      {latestToken ? (
                        <>
                          <span className="current-token-label">Current Token</span>
                          <span className="current-token-number" style={{ color }}>
                            {latestToken.token_number}
                          </span>
                          <span className="token-status-badge">
                            {latestToken.status === 'called' ? '📢 Called' : '⏳ Waiting'}
                          </span>
                        </>
                      ) : (
                        <span className="no-token">No active token</span>
                      )}
                    </div>
                  </div>

                  <div className="dept-card-footer">
                    <span className="dept-prefix">Prefix: {dept.token_prefix || dept.name.substring(0, 1)}</span>
                    <span className="dept-updated">Updated: Just now</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredDepartments.filter(d => d.is_open === 1).length === 0 && !loading && (
          <div className="empty-state">
            <span className="empty-icon">🏥</span>
            <p>No departments available</p>
            <span className="empty-sub">Please check back later</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveQueuePage;