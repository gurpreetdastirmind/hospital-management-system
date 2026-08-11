// frontend/src/components/Staff/LiveQueue.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';

const LiveQueue = ({ tokens, departments, onRefresh }) => {
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    phoneNumber: '',
    age: '',
    department: ''
  });
  const [generating, setGenerating] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [callingDepartment, setCallingDepartment] = useState(null);
  
  // Use ref to prevent auto-refresh conflicts
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

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
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    onRefresh();
    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 1000);
  };

  // Auto-refresh every 10 seconds (increased from 5 to avoid conflicts)
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (!isRefreshingRef.current) {
        onRefresh();
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

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!newToken.name || !newToken.phoneNumber || !newToken.department) {
      alert('Please fill all required fields');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/api/tokens/generate', {
        ...newToken,
        source: 'Counter',
        age: newToken.age || null
      });

      if (response.data.success) {
        alert(`✅ Token ${response.data.data.token_number} generated successfully!`);
        setNewToken({ name: '', phoneNumber: '', age: '', department: '' });
        setShowGenerateForm(false);
        
        // Refresh immediately after generation
        await onRefresh();
        
        // Force a second refresh after a short delay to ensure data consistency
        setTimeout(() => {
          onRefresh();
        }, 500);
      } else {
        alert(response.data.error || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Error generating token. Please try again.');
    } finally {
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
      } else {
        alert(response.data.error || 'Error calling next token');
      }
    } catch (error) {
      console.error('Error calling token:', error);
      alert('Error calling next token. Please try again.');
    } finally {
      setCallingDepartment(null);
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
          >
            {showGenerateForm ? '✕ Cancel' : '+ Generate Counter Token'}
          </button>
          <button 
            className="refresh-btn" 
            onClick={handleManualRefresh}
            disabled={isRefreshingRef.current}
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
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone Number *"
                value={newToken.phoneNumber}
                onChange={(e) => setNewToken({...newToken, phoneNumber: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Age"
                value={newToken.age}
                onChange={(e) => setNewToken({...newToken, age: e.target.value})}
              />
            </div>
            <div className="form-group">
              <select
                value={newToken.department}
                onChange={(e) => setNewToken({...newToken, department: e.target.value})}
                required
              >
                <option value="">Select Department *</option>
                {departments.filter(d => d.is_open === 1).map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={generating}>
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
                      disabled={isCalling || waitingCount === 0}
                      style={{ 
                        backgroundColor: waitingCount === 0 ? '#ccc' : color,
                        cursor: waitingCount === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCalling ? '⏳ Calling...' : '📢 Call Next'}
                    </button>
                  </div>
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