// frontend/src/components/staff/StaffApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveQueue from './LiveQueue';
import TokenRecords from './TokenRecords';
import DepartmentSetup from './DepartmentSetup';
import '../../styles/StaffApp.css';
import api from '../../api';
const StaffApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('queue');
  const [departments, setDepartments] = useState([]);
  const [tokens, setTokens] = useState([]);



  // Check if logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('staffLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
      navigate('/staff');
    }
  }, [navigate]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`/api/departments`);
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch(`/api/tokens`);
      const data = await response.json();
      if (data.success) {
        setTokens(data.data);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchTokens();
    
    const interval = setInterval(() => {
      fetchTokens();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('staffLoggedIn');
    localStorage.removeItem('staffEmail');
    localStorage.removeItem('staffName');
    localStorage.removeItem('staffRole');
    navigate('/staff');
  };

  const staffName = localStorage.getItem('staffName') || 'Staff';
  const staffRole = localStorage.getItem('staffRole') || 'Staff';

  return (
    <div className="staff-app">
      {/* Sidebar */}
      <div className="staff-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🏥</div>
          <h2>CIVIL HOSPITAL</h2>
          <span className="sidebar-subtitle">Staff Portal</span>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <span className="sidebar-icon">📋</span>
            Live Queue
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <span className="sidebar-icon">📊</span>
            Token Records
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => setActiveTab('departments')}
          >
            <span className="sidebar-icon">⚙️</span>
            Departments
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">👤</span>
            <div>
              <div className="user-name">{staffName}</div>
              <div className="user-role">{staffRole}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="staff-main">
        <div className="staff-topbar">
          <div className="topbar-left">
            <h1>Civil Hospital <span>| OPD</span></h1>
          </div>
          <div className="topbar-right">
            <span className="live-indicator">● Live</span>
            <span className="token-count">Total Tokens: {tokens.length}</span>
          </div>
        </div>

        <div className="staff-content">
          {activeTab === 'queue' && (
            <LiveQueue 
              tokens={tokens} 
              departments={departments}
              onRefresh={() => {
                fetchTokens();
                fetchDepartments();
              }}
            />
          )}
          {activeTab === 'records' && (
            <TokenRecords 
              tokens={tokens}
              onRefresh={fetchTokens}
            />
          )}
          {activeTab === 'departments' && (
            <DepartmentSetup 
              departments={departments}
              onUpdate={() => {
                fetchDepartments();
                fetchTokens();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffApp;