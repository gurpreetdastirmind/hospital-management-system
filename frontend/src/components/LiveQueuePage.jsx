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
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'Civil Hospital',
    address: '123 Healthcare Boulevard, Medical District',
    phone: '+91 12345 67890',
    emergency: '+91 98765 43210',
    email: 'info@civilhospital.com',
    is24_7: true,
    emergencyServices: ['Emergency Room', 'Trauma Center', 'ICU', 'Ambulance Service'],
    departments: []
  });

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
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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

  const filteredDepartments = selectedDepartment === 'all' 
    ? departments 
    : departments.filter(d => d.name === selectedDepartment);

  const activeDepartments = departments.filter(d => d.is_open === 1);

  return (
    <div className="live-queue-page">
      {/* Header with Hospital Info */}
      <div className="hospital-header">
        <div className="hospital-header-top">
          <div className="hospital-brand">
            <span className="hospital-icon">🏥</span>
            <div>
              <h1>{hospitalDetails.name}</h1>
              <p className="hospital-tagline">Excellence in Healthcare Since 1950</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="back-btn" onClick={handleBackToApp}>
              ← Back to App
            </button>
          </div>
        </div>

        {/* Hospital Info Banner */}
        <div className="hospital-info-banner">
          <div className="info-item">
            <span className="info-icon">📞</span>
            <div>
              <span className="info-label">Emergency</span>
              <span className="info-value emergency-number">{hospitalDetails.emergency}</span>
            </div>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-icon">🕐</span>
            <div>
              <span className="info-label">Availability</span>
              <span className="info-value available">24/7 Available</span>
            </div>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-icon">🚑</span>
            <div>
              <span className="info-label">Ambulance</span>
              <span className="info-value">{hospitalDetails.ambulance}</span>
            </div>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div>
              <span className="info-label">Location</span>
              <span className="info-value">{hospitalDetails.address}</span>
            </div>
          </div>
        </div>

        {/* Emergency Services Quick Links */}
        <div className="emergency-services">
          <div className="emergency-title">🚨 Emergency Services</div>
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
          <h2>📋 Live Token Queue</h2>
          <div className="queue-stats">
            <span className="stat-badge waiting">
              🟡 Waiting: {getTotalWaiting()}
            </span>
            <span className="stat-badge called">
              🔵 Called: {getTotalCalled()}
            </span>
            <span className="stat-badge completed">
              🟢 Completed: {getTotalCompleted()}
            </span>
            <span className="stat-badge total">
              📊 Total: {tokens.length}
            </span>
          </div>
        </div>

        {/* Department Filter */}
        <div className="department-filter">
          <button
            className={`filter-btn ${selectedDepartment === 'all' ? 'active' : ''}`}
            onClick={() => handleDepartmentClick('all')}
          >
            All Departments
          </button>
          {activeDepartments.map(dept => {
            const waiting = getWaitingCount(dept.name);
            return (
              <button
                key={dept.id}
                className={`filter-btn ${selectedDepartment === dept.name ? 'active' : ''}`}
                onClick={() => handleDepartmentClick(dept.name)}
                style={{ 
                  borderColor: getDepartmentColor(dept.name),
                  backgroundColor: selectedDepartment === dept.name ? getDepartmentColor(dept.name) : 'transparent',
                  color: selectedDepartment === dept.name ? 'white' : 'inherit'
                }}
              >
                {dept.icon} {dept.name} ({waiting})
              </button>
            );
          })}
        </div>

        {/* Department Cards */}
        <div className="department-cards-grid">
          {loading ? (
            <div className="loading-state">⏳ Loading queue data...</div>
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
                      <span className="dept-icon-large">{dept.icon || '🏥'}</span>
                      <div>
                        <h3>{dept.name}</h3>
                        <span className="dept-room">Room {room}</span>
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
                        </>
                      ) : (
                        <span className="no-token">No active token</span>
                      )}
                    </div>
                  </div>

                  <div className="dept-card-footer">
                    <span className="dept-prefix">Prefix: {dept.token_prefix || dept.name.substring(0, 1)}</span>
                    {latestToken && (
                      <span className="token-status">
                        {latestToken.status === 'called' ? '📢 Called' : '⏳ Waiting'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredDepartments.filter(d => d.is_open === 1).length === 0 && !loading && (
          <div className="empty-state">
            <p>🏥 No departments available</p>
          </div>
        )}
      </div>

      {/* Hospital Footer */}
      <div className="hospital-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🏥 {hospitalDetails.name}</h4>
            <p>{hospitalDetails.address}</p>
            <p>📞 {hospitalDetails.phone}</p>
            <p>📧 {hospitalDetails.email}</p>
          </div>
          <div className="footer-section">
            <h4>🕐 Working Hours</h4>
            <p>🟢 24/7 Emergency Services</p>
            <p>🕘 OPD: Mon-Sat 9:00 AM - 6:00 PM</p>
            <p>📅 Sunday: Emergency Only</p>
          </div>
          <div className="footer-section">
            <h4>📞 Emergency Contacts</h4>
            <p className="emergency-contact">🚑 Emergency: {hospitalDetails.emergency}</p>
            <p className="ambulance-contact">🚨 Ambulance: {hospitalDetails.ambulance}</p>
            <p>🆘 Helpline: 108</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 {hospitalDetails.name}. All rights reserved. | Made with ❤️ for better healthcare</p>
        </div>
      </div>
    </div>
  );
};

export default LiveQueuePage;