// frontend/src/components/Staff/TokenRecords.jsx
import React, { useState } from 'react';

const TokenRecords = ({ tokens, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status) => {
    const badges = {
      'waiting': '🟡 Waiting',
      'called': '🔵 Called',
      'completed': '🟢 Completed',
      'missed': '🔴 Missed'
    };
    return badges[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };

  const filteredTokens = tokens
    .filter(token => filter === 'all' || token.status === filter)
    .filter(token => 
      token.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.token_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.phone_number?.includes(searchTerm) ||
      token.doctor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getSourceBadge = (source) => {
    return source === 'App' ? '📱 App' : '🏪 Counter';
  };

  return (
    <div className="token-records">
      <div className="records-header">
        <h2>📊 Token Records</h2>
        <div className="records-actions">
          <button className="refresh-btn" onClick={onRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="records-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tokens.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'waiting' ? 'active' : ''}`}
            onClick={() => setFilter('waiting')}
          >
            🟡 Waiting ({tokens.filter(t => t.status === 'waiting').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'called' ? 'active' : ''}`}
            onClick={() => setFilter('called')}
          >
            🔵 Called ({tokens.filter(t => t.status === 'called').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            🟢 Completed ({tokens.filter(t => t.status === 'completed').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'missed' ? 'active' : ''}`}
            onClick={() => setFilter('missed')}
          >
            🔴 Missed ({tokens.filter(t => t.status === 'missed').length})
          </button>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by name, token, phone, doctor, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="records-table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Name</th>
              <th>Age</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Room</th>
              <th>Doctor</th>
              <th>Source</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-records">
                  No records found
                </td>
              </tr>
            ) : (
              filteredTokens.map(token => (
                <tr key={token.id}>
                  <td className="token-cell">{token.token_number}</td>
                  <td className="name-cell">{token.patient_name}</td>
                  <td>{token.age || 'N/A'}</td>
                  <td>{token.phone_number}</td>
                  <td>
                    <span className="department-tag">{token.department}</span>
                  </td>
                  <td>{token.room_number || 'N/A'}</td>
                  <td>
                    {token.doctor ? (
                      <span className="doctor-tag">👨‍⚕️ {token.doctor}</span>
                    ) : (
                      <span className="no-doctor">—</span>
                    )}
                  </td>
                  <td>{getSourceBadge(token.source)}</td>
                  <td>
                    <span className={getStatusClass(token.status)}>
                      {getStatusBadge(token.status)}
                    </span>
                  </td>
                  <td className="time-cell">
                    {new Date(token.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenRecords;