// frontend/src/components/LiveQueuePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App.jsx';
import '../styles/LiveQueuePage.css';

const LiveQueuePage = () => {
  const navigate = useNavigate();
  const { language, translations } = useContext(LanguageContext);
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
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const handleBackToApp = () => {
    navigate('/');
  };

  const handleCallEmergency = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

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

        {/* Facilities Section */}
        <div className="facilities-section">
          <div className="facilities-header">
            <span className="facilities-icon">🏥</span>
            <span className="facilities-title">Hospital Facilities</span>
          </div>
          <div className="facilities-grid">
            {hospitalDetails.facilities.map((facility, index) => (
              <span key={index} className="facility-tag">{facility}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveQueuePage;