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

  const getDepartmentName = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept ? dept.name : deptName;
  };

  const getDepartmentColor = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#4a90d9';
  };

  const getDepartmentIcon = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.icon || '🏥';
  };

  // Calculate availability status based on doctor's status
  const getAvailabilityStatus = (doctor) => {
    if (doctor.status === 'inactive') {
      return { status: 'unavailable', label: 'Unavailable', color: '#e74c3c' };
    }
    
    // Check if doctor has tokens today
    // For demo purposes, we'll use random availability
    const random = Math.random();
    if (random < 0.3) {
      return { status: 'busy', label: 'Busy', color: '#ff9800' };
    } else if (random < 0.6) {
      return { status: 'available', label: 'Available', color: '#4CAF50' };
    } else {
      return { status: 'on-break', label: 'On Break', color: '#9E9E9E' };
    }
  };

  // Get availability time slots
  const getAvailabilityTimes = (doctor) => {
    // In production, this would come from the database
    // For demo, generate realistic time slots
    const slots = [];
    const now = new Date();
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      if (Math.random() > 0.3) { // 70% chance of having a slot
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00 - ${(hour+1).toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.4
        });
      }
    }
    return slots.slice(0, 4); // Return up to 4 slots
  };

  const getExperienceYears = (experience) => {
    if (!experience) return 'N/A';
    const years = parseInt(experience);
    return years ? `${years} years` : experience;
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
             doctor.qualification?.toLowerCase().includes(search);
    });

  const handleBackToApp = () => {
    navigate('/');
  };

  const handleViewDoctor = (doctor) => {
    // Navigate to doctor detail page or show modal
    alert(`👨‍⚕️ ${doctor.name}\n\nSpecialization: ${doctor.specialization}\nDepartment: ${doctor.department}\nQualification: ${doctor.qualification || 'N/A'}\nExperience: ${getExperienceYears(doctor.experience)}\nPhone: ${doctor.phone || 'N/A'}\nEmail: ${doctor.email || 'N/A'}`);
  };

  const activeDepartments = departments.filter(d => d.is_open === 1);

  return (
    <div className="doctor-info-page">
      {/* Header */}
      <div className="doctor-header">
        <div className="doctor-header-top">
          <div className="doctor-brand">
            <span className="doctor-icon">👨‍⚕️</span>
            <div>
              <h1>Doctor Information</h1>
              <p className="doctor-tagline">Find the right doctor for you</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="back-btn" onClick={handleBackToApp}>
              ← Back to App
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="doctor-stats">
          <div className="stat-card">
            <span className="stat-number">{doctors.length}</span>
            <span className="stat-label">Total Doctors</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{doctors.filter(d => d.status === 'active').length}</span>
            <span className="stat-label">Active Doctors</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{activeDepartments.length}</span>
            <span className="stat-label">Departments</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="doctor-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, specialization, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        <div className="department-filter">
          <button
            className={`filter-btn ${selectedDepartment === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDepartment('all')}
          >
            All Departments
          </button>
          {activeDepartments.map(dept => (
            <button
              key={dept.id}
              className={`filter-btn ${selectedDepartment === dept.name ? 'active' : ''}`}
              onClick={() => setSelectedDepartment(dept.name)}
              style={{
                borderColor: selectedDepartment === dept.name ? dept.color : '#e8ecf0',
                backgroundColor: selectedDepartment === dept.name ? dept.color : 'transparent',
                color: selectedDepartment === dept.name ? 'white' : '#333'
              }}
            >
              {dept.icon} {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="doctor-cards-grid">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👨‍⚕️</span>
            <p>No doctors found</p>
            <span className="empty-sub">Try adjusting your search or filter</span>
          </div>
        ) : (
          filteredDoctors.map(doctor => {
            const availability = getAvailabilityStatus(doctor);
            const slots = getAvailabilityTimes(doctor);
            const deptColor = getDepartmentColor(doctor.department);
            const deptIcon = getDepartmentIcon(doctor.department);

            return (
              <div key={doctor.id} className="doctor-card" style={{ borderTopColor: deptColor }}>
                <div className="doctor-card-header">
                  <div className="doctor-avatar" style={{ backgroundColor: deptColor }}>
                    <span>{deptIcon}</span>
                  </div>
                  <div className="doctor-header-info">
                    <h3>{doctor.name}</h3>
                    <span className="doctor-specialization">{doctor.specialization}</span>
                  </div>
                  <div className="doctor-status">
                    <span 
                      className={`status-badge ${availability.status}`}
                      style={{ backgroundColor: availability.color }}
                    >
                      {availability.label}
                    </span>
                  </div>
                </div>

                <div className="doctor-card-body">
                  <div className="doctor-details">
                    <div className="detail-item">
                      <span className="detail-icon">🏥</span>
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{getDepartmentName(doctor.department)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🎓</span>
                      <span className="detail-label">Qualification</span>
                      <span className="detail-value">{doctor.qualification || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⭐</span>
                      <span className="detail-label">Experience</span>
                      <span className="detail-value">{getExperienceYears(doctor.experience)}</span>
                    </div>
                    {doctor.phone && (
                      <div className="detail-item">
                        <span className="detail-icon">📞</span>
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{doctor.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Availability Times */}
                  <div className="availability-times">
                    <div className="availability-header">
                      <span className="availability-icon">🕐</span>
                      <span className="availability-label">Available Times</span>
                    </div>
                    <div className="time-slots">
                      {slots.length > 0 ? (
                        slots.map((slot, index) => (
                          <span 
                            key={index} 
                            className={`time-slot ${slot.available ? 'available' : 'booked'}`}
                          >
                            {slot.time}
                          </span>
                        ))
                      ) : (
                        <span className="no-slots">No available slots</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="doctor-card-footer">
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDoctor(doctor)}
                    style={{ backgroundColor: deptColor }}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="doctor-footer">
        <div className="footer-info">
          <span>👨‍⚕️ {filteredDoctors.length} doctors available</span>
          <span>🏥 {activeDepartments.length} departments</span>
          <span>🕐 24/7 Emergency Services</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorInfo;