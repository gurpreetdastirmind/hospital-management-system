// frontend/src/components/DoctorInfo.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App.jsx';
import api from '../api';
import '../styles/DoctorInfo.css';

const DoctorInfo = () => {
  const navigate = useNavigate();
  const { language, translations } = useContext(LanguageContext);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, deptsRes] = await Promise.all([
        api.get('/api/doctors'),
        api.get('/api/departments')
      ]);

      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.data);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#667eea';
  };

  const getDepartmentIcon = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.icon || '🏥';
  };

  const getStatusColor = (doctor) => {
    if (doctor.status === 'inactive') return '#e74c3c';
    return '#4CAF50';
  };

  const getStatusLabel = (doctor) => {
    if (doctor.status === 'inactive') return 'Unavailable';
    return 'Available';
  };

  const getStatusIcon = (doctor) => {
    if (doctor.status === 'inactive') return '🔴';
    return '🟢';
  };

  const getExperienceYears = (experience) => {
    if (!experience) return 'N/A';
    const years = parseInt(experience);
    return years ? `${years} yrs` : experience;
  };

  const filteredDoctors = doctors
    .filter(doctor => {
      if (selectedDepartment === 'all') return true;
      return doctor.department === selectedDepartment;
    })
    .filter(doctor => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return doctor.name.toLowerCase().includes(search) ||
             doctor.specialization.toLowerCase().includes(search) ||
             doctor.department.toLowerCase().includes(search) ||
             (doctor.qualification && doctor.qualification.toLowerCase().includes(search));
    });

  const handleBackToApp = () => {
    navigate('/');
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor);
  };

  const activeDepartments = departments.filter(d => d.is_open === 1);

  // Generate time slots for a doctor
  const getTimeSlots = (doctor) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      if (Math.random() > 0.3) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00 - ${(hour+1).toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.4
        });
      }
    }
    return slots.slice(0, 4);
  };

  return (
    <div className="doctor-info-page">
      {/* Header */}
      <div className="doctor-header">
        <div className="doctor-header-top">
          <div className="doctor-brand">
            <div className="brand-icon">👨‍⚕️</div>
            <div>
              <h1>Doctor Information</h1>
              <p>Find the right doctor for you</p>
            </div>
          </div>
          <button className="back-btn" onClick={handleBackToApp}>
            ← Back
          </button>
        </div>

        <div className="doctor-stats">
          <div className="stat-item">
            <span className="stat-number">{doctors.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{doctors.filter(d => d.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{activeDepartments.length}</span>
            <span className="stat-label">Departments</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Emergency</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${selectedDepartment === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDepartment('all')}
          >
            All
          </button>
          {activeDepartments.map(dept => (
            <button
              key={dept.id}
              className={`filter-tab ${selectedDepartment === dept.name ? 'active' : ''}`}
              onClick={() => setSelectedDepartment(dept.name)}
              style={{
                borderColor: selectedDepartment === dept.name ? dept.color : '#e8ecf0',
                backgroundColor: selectedDepartment === dept.name ? dept.color : 'transparent',
                color: selectedDepartment === dept.name ? 'white' : '#4a5a6e'
              }}
            >
              {dept.icon} {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Grid */}
      <div className="doctor-grid">
        {loading ? (
          <div className="loading-state">
            <div className="loader">⏳</div>
            <p>Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👨‍⚕️</span>
            <p>No doctors found</p>
            <span>Try adjusting your search</span>
          </div>
        ) : (
          filteredDoctors.map(doctor => {
            const color = getDepartmentColor(doctor.department);
            const icon = getDepartmentIcon(doctor.department);
            const statusColor = getStatusColor(doctor);
            const statusLabel = getStatusLabel(doctor);
            const statusIcon = getStatusIcon(doctor);
            const slots = getTimeSlots(doctor);
            const isExpanded = selectedDoctor?.id === doctor.id;

            return (
              <div 
                key={doctor.id} 
                className={`doctor-card ${isExpanded ? 'expanded' : ''}`}
                style={{ borderLeftColor: color }}
              >
                <div className="doctor-card-main" onClick={() => handleSelectDoctor(doctor)}>
                  <div className="doctor-avatar" style={{ backgroundColor: color }}>
                    <span>{icon}</span>
                  </div>
                  <div className="doctor-info">
                    <h3>{doctor.name}</h3>
                    <span className="specialty">{doctor.specialization}</span>
                    <div className="doctor-meta">
                      <span className="doctor-dept">{doctor.department}</span>
                      <span className="doctor-status" style={{ color: statusColor }}>
                        {statusIcon} {statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="card-expand-icon">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="doctor-card-details">
                    <div className="detail-grid">
                      <div className="detail-block">
                        <span className="detail-label">🎓 Qualification</span>
                        <span className="detail-value">{doctor.qualification || 'N/A'}</span>
                      </div>
                      <div className="detail-block">
                        <span className="detail-label">⭐ Experience</span>
                        <span className="detail-value">{getExperienceYears(doctor.experience)}</span>
                      </div>
                      {doctor.phone && (
                        <div className="detail-block">
                          <span className="detail-label">📞 Phone</span>
                          <span className="detail-value">{doctor.phone}</span>
                        </div>
                      )}
                      {doctor.email && (
                        <div className="detail-block">
                          <span className="detail-label">✉️ Email</span>
                          <span className="detail-value">{doctor.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="time-slots-section">
                      <div className="time-slots-header">
                        <span>🕐 Available Times</span>
                      </div>
                      <div className="time-slots-grid">
                        {slots.length > 0 ? (
                          slots.map((slot, index) => (
                            <span 
                              key={index} 
                              className={`slot ${slot.available ? 'available' : 'booked'}`}
                            >
                              {slot.time}
                            </span>
                          ))
                        ) : (
                          <span className="no-slots">No slots available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bottom-stats">
        <span>👨‍⚕️ {filteredDoctors.length} doctors</span>
        <span>🏥 {activeDepartments.length} departments</span>
        <span>🕐 24/7 Emergency</span>
      </div>
    </div>
  );
};

export default DoctorInfo;