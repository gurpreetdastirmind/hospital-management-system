// frontend/src/components/Staff/LiveQueue.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';

const LiveQueue = ({ tokens, departments, onRefresh }) => {
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    phoneNumber: '',
    age: '',
    department: '',
    doctor: ''
  });
  const [generating, setGenerating] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [callingDepartment, setCallingDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  
  // Use ref to prevent auto-refresh conflicts
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const isCallingRef = useRef(false);

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/doctors');
      if (response.data.success) {
        setDoctors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Update available doctors when department changes
  useEffect(() => {
    if (newToken.department) {
      const filtered = doctors.filter(d => 
        d.department === newToken.department && d.status === 'active'
      );
      setAvailableDoctors(filtered);
      // Reset doctor selection if current selection is not available
      if (newToken.doctor && !filtered.some(d => d.name === newToken.doctor)) {
        setNewToken(prev => ({ ...prev, doctor: '' }));
      }
    } else {
      setAvailableDoctors([]);
      setNewToken(prev => ({ ...prev, doctor: '' }));
    }
  }, [newToken.department, doctors]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Manual refresh with debounce
  const handleManualRefresh = () => {
    if (isRefreshingRef.current || isGeneratingRef.current || isCallingRef.current) return;
    isRefreshingRef.current = true;
    onRefresh();
    fetchDoctors();
    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 1000);
  };

  // Auto-refresh every 10 seconds - BUT NOT during operations
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      // Don't auto-refresh during generation or calling
      if (!isRefreshingRef.current && !isGeneratingRef.current && !isCallingRef.current) {
        onRefresh();
        fetchDoctors();
      }
    }, 10000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [onRefresh]);

  const getWaitingCount = (deptName) => {
    return tokens.filter(t => 
      t.department === deptName && 
      t.status === 'waiting'
    ).length;
  };

  const getCalledToken = (deptName) => {
    const called = tokens.filter(t => 
      t.department === deptName && 
      t.status === 'called'
    );
    return called.length > 0 ? called[0] : null;
  };

  const getLatestWaitingToken = (deptName) => {
    const waiting = tokens.filter(t => 
      t.department === deptName && 
      t.status === 'waiting'
    );
    return waiting.length > 0 ? waiting[0] : null;
  };

  const getDepartmentRoom = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.room || 'N/A';
  };

  const getDepartmentColor = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#4a90d9';
  };

  const getDepartmentDoctor = (deptName) => {
    const activeDoctors = doctors.filter(d => 
      d.department === deptName && d.status === 'active'
    );
    if (activeDoctors.length === 0) return null;
    return activeDoctors[0]; // Return first active doctor
  };

  const getDoctorName = (deptName) => {
    const doctor = getDepartmentDoctor(deptName);
    return doctor ? doctor.name : 'No doctor assigned';
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!newToken.name || !newToken.phoneNumber || !newToken.department) {
      alert('Please fill all required fields');
      return;
    }

    // Set generating flag to prevent auto-refresh
    isGeneratingRef.current = true;
    setGenerating(true);

    try {
      const response = await api.post('/api/tokens/generate', {
        ...newToken,
        source: 'Counter',
        age: newToken.age || null,
        doctor: newToken.doctor || null
      });

      if (response.data.success) {
        alert(`✅ Token ${response.data.data.token_number} generated successfully!`);
        setNewToken({ name: '', phoneNumber: '', age: '', department: '', doctor: '' });
        setShowGenerateForm(false);
        
        // Refresh immediately after generation
        await onRefresh();
        await fetchDoctors();
        
        // Force a second refresh after a short delay to ensure data consistency
        setTimeout(async () => {
          await onRefresh();
          await fetchDoctors();
          // Reset generating flag after all refreshes are complete
          isGeneratingRef.current = false;
          setGenerating(false);
        }, 500);
      } else {
        alert(response.data.error || 'Failed to generate token');
        isGeneratingRef.current = false;
        setGenerating(false);
      }
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Error generating token. Please try again.');
      isGeneratingRef.current = false;
      setGenerating(false);
    }
  };

  const handleCallNext = async (department) => {
    // Prevent multiple calls
    if (callingDepartment === department) return;
    
    // Check if there are waiting tokens
    const waitingCount = getWaitingCount(department);
    if (waitingCount === 0) {
      alert(`ℹ️ No waiting tokens for ${department}`);
      return;
    }
    
    // Set calling flag to prevent auto-refresh
    isCallingRef.current = true;
    setCallingDepartment(department);
    
    try {
      const response = await api.post('/api/tokens/call-next', { department });

      if (response.data.success) {
        if (response.data.data) {
          alert(`📢 Called ${response.data.data.token_number} - ${response.data.data.patient_name} from ${department}`);
        } else {
          alert(`ℹ️ No waiting tokens for ${department}`);
        }
        // Refresh after calling
        await onRefresh();
        await fetchDoctors();
      } else {
        alert(response.data.error || 'Error calling next token');
      }
    } catch (error) {
      console.error('Error calling token:', error);
      alert('Error calling next token. Please try again.');
    } finally {
      setCallingDepartment(null);
      isCallingRef.current = false;
    }
  };

  // Get ONLY departments that have active tokens (waiting or called)
  const departmentsWithActiveTokens = departments.filter(dept => {
    const hasWaiting = tokens.some(t => 
      t.department === dept.name && t.status === 'waiting'
    );
    const hasCalled = tokens.some(t => 
      t.department === dept.name && t.status === 'called'
    );
    return (hasWaiting || hasCalled) && dept.is_open === 1;
  });

  const filteredDepartments = selectedDepartment === 'all' 
    ? departmentsWithActiveTokens 
    : departmentsWithActiveTokens.filter(d => d.name === selectedDepartment);

  return (
    <div className="live-queue">
      {/* Header */}
      <div className="queue-header">
        <h2>Live Token Queue</h2>
        <div className="queue-actions">
          <button 
            className="generate-btn"
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            disabled={generating || isCallingRef.current}
          >
            {showGenerateForm ? '✕ Cancel' : '+ Generate Counter Token'}
          </button>
          <button 
            className="refresh-btn" 
            onClick={handleManualRefresh}
            disabled={isRefreshingRef.current || generating || isCallingRef.current}
          >
            {isRefreshingRef.current ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Generate Form */}
      {showGenerateForm && (
        <div className="generate-form">
          <h3>Generate Token for Counter</h3>
          <form onSubmit={handleGenerateToken}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Patient Name *"
                value={newToken.name}
                onChange={(e) => setNewToken({...newToken, name: e.target.value})}
                required
                disabled={generating}
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone Number *"
                value={newToken.phoneNumber}
                onChange={(e) => setNewToken({...newToken, phoneNumber: e.target.value})}
                required
                disabled={generating}
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Age"
                value={newToken.age}
                onChange={(e) => setNewToken({...newToken, age: e.target.value})}
                disabled={generating}
              />
            </div>
            <div className="form-group">
              <select
                value={newToken.department}
                onChange={(e) => setNewToken({...newToken, department: e.target.value, doctor: ''})}
                required
                disabled={generating}
              >
                <option value="">Select Department *</option>
                {departments.filter(d => d.is_open === 1).map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} - {dept.room}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select
                value={newToken.doctor}
                onChange={(e) => setNewToken({...newToken, doctor: e.target.value})}
                required
                disabled={generating || !newToken.department}
              >
                <option value="">Select Doctor *</option>
                {availableDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.name}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
                {availableDoctors.length === 0 && newToken.department && (
                  <option value="" disabled>No active doctors in this department</option>
                )}
              </select>
            </div>
            <button type="submit" disabled={generating || !newToken.doctor}>
              {generating ? '⏳ Generating...' : 'Generate Token'}
            </button>
          </form>
        </div>
      )}

      {/* Department Filter - Only show departments with active tokens */}
      {departmentsWithActiveTokens.length > 0 && (
        <div className="department-filter">
          <button 
            className={`filter-btn ${selectedDepartment === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDepartment('all')}
            disabled={generating || isCallingRef.current}
          >
            All Departments
          </button>
          {departmentsWithActiveTokens.map(dept => {
            const waitingCount = getWaitingCount(dept.name);
            return (
              <button
                key={dept.id}
                className={`filter-btn ${selectedDepartment === dept.name ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(dept.name)}
                style={{ borderColor: getDepartmentColor(dept.name) }}
                disabled={generating || isCallingRef.current}
              >
                {dept.name} ({waitingCount} waiting)
              </button>
            );
          })}
        </div>
      )}

      {/* Department Cards - Only show departments with active tokens */}
      <div className="department-cards">
        {filteredDepartments.length === 0 ? (
          <div className="empty-queue">
            <p>🎉 No patients waiting</p>
          </div>
        ) : (
          filteredDepartments.map(dept => {
            const deptName = dept.name;
            const waitingCount = getWaitingCount(deptName);
            const calledToken = getCalledToken(deptName);
            const waitingToken = getLatestWaitingToken(deptName);
            const isCalling = callingDepartment === deptName;
            const color = getDepartmentColor(deptName);
            const room = getDepartmentRoom(deptName);
            const doctorName = getDoctorName(deptName);
            const assignedDoctor = getDepartmentDoctor(deptName);
            
            // Show token: called token first, then waiting token
            const displayToken = calledToken || waitingToken;

            return (
              <div key={dept.id} className="dept-card">
                <div className="dept-card-header">
                  <span className="dept-card-name">{deptName}</span>
                  <span className="dept-card-room">Room {room}</span>
                </div>
                <div className="dept-card-body">
                  <div className="dept-card-stats">
                    <span className="waiting-count">{waitingCount} waiting</span>
                  </div>
                  <div className="dept-card-token">
                    {displayToken ? (
                      <span className="token-number" style={{ color: color }}>
                        {displayToken.token_number}
                      </span>
                    ) : (
                      <span className="token-number" style={{ color: '#999' }}>
                        No active token
                      </span>
                    )}
                    <button 
                      className="call-next-btn"
                      onClick={() => handleCallNext(deptName)}
                      disabled={isCalling || waitingCount === 0 || generating || isCallingRef.current}
                      style={{ 
                        backgroundColor: (waitingCount === 0 || generating || isCallingRef.current) ? '#ccc' : color,
                        cursor: (waitingCount === 0 || generating || isCallingRef.current) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCalling ? '⏳ Calling...' : '📢 Call Next'}
                    </button>
                  </div>
                </div>
                {/* Doctor info */}
                <div className="dept-card-doctor">
                  <span className="doctor-label">👨‍⚕️ Doctor:</span>
                  <span className="doctor-name" style={{ color: assignedDoctor ? color : '#999' }}>
                    {doctorName}
                  </span>
                  {assignedDoctor && (
                    <span className="doctor-specialization">
                      ({assignedDoctor.specialization})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveQueue;