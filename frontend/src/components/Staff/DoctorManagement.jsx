// frontend/src/components/Staff/DoctorManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const DoctorManagement = ({ departments, onUpdate }) => {
  const [doctors, setDoctors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    department: '',
    phone: '',
    email: '',
    qualification: '',
    experience: '',
    status: 'active'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (editingDoctor) {
        response = await api.put(`/api/doctors/${editingDoctor.id}`, formData);
      } else {
        response = await api.post('/api/doctors', formData);
      }

      if (response.data.success) {
        alert(editingDoctor ? 'Doctor updated successfully!' : 'Doctor added successfully!');
        setShowAddForm(false);
        setEditingDoctor(null);
        setFormData({
          name: '',
          specialization: '',
          department: '',
          phone: '',
          email: '',
          qualification: '',
          experience: '',
          status: 'active'
        });
        fetchDoctors();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert(error.response?.data?.message || 'Error saving doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization || '',
      department: doctor.department || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience || '',
      status: doctor.status || 'active'
    });
    setShowAddForm(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await api.patch(`/api/doctors/${id}/toggle-status`);
      if (response.data.success) {
        fetchDoctors();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      alert('Error updating doctor status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const response = await api.delete(`/api/doctors/${id}`);
      if (response.data.success) {
        alert('Doctor deleted successfully!');
        fetchDoctors();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Error deleting doctor');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      specialization: '',
      department: '',
      phone: '',
      email: '',
      qualification: '',
      experience: '',
      status: 'active'
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="status-badge active">🟢 Active</span>;
    }
    return <span className="status-badge inactive">🔴 Inactive</span>;
  };

  const getDepartmentName = (deptName) => {
    const dept = departments.find(d => d.name === deptName);
    return dept ? dept.name : 'Not Assigned';
  };

  return (
    <div className="doctor-management">
      <div className="doctor-header">
        <h2>👨‍⚕️ Doctor Management</h2>
        <button 
          className="add-doctor-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '➕ Add Doctor'}
        </button>
      </div>

      {showAddForm && (
        <div className="doctor-form">
          <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Doctor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="form-group">
                <label>Specialization *</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  required
                  placeholder="Cardiologist"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d.is_open === 1).map(dept => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="doctor@hospital.com"
                />
              </div>
              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  placeholder="MBBS, MD"
                />
              </div>
              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="5"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="doctor-list">
        <div className="doctor-stats">
          <div className="stat-item">
            <span className="stat-label">Total Doctors</span>
            <span className="stat-value">{doctors.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value active-count">
              {doctors.filter(d => d.status === 'active').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Inactive</span>
            <span className="stat-value inactive-count">
              {doctors.filter(d => d.status === 'inactive').length}
            </span>
          </div>
        </div>

        <div className="records-table-wrapper">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-doctors">
                    No doctors found. Add your first doctor above.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor, index) => (
                  <tr key={doctor.id} className={doctor.status === 'inactive' ? 'inactive-row' : ''}>
                    <td>{index + 1}</td>
                    <td className="doctor-name">{doctor.name}</td>
                    <td>{doctor.specialization}</td>
                    <td>
                      <span className="department-tag">
                        {getDepartmentName(doctor.department)}
                      </span>
                    </td>
                    <td>{doctor.qualification || 'N/A'}</td>
                    <td>{doctor.experience ? `${doctor.experience} yrs` : 'N/A'}</td>
                    <td>
                      <div className="contact-info">
                        {doctor.phone && <span>📱 {doctor.phone}</span>}
                        {doctor.email && <span>✉️ {doctor.email}</span>}
                      </div>
                    </td>
                    <td>{getStatusBadge(doctor.status)}</td>
                    <td className="actions-cell">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(doctor)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className={`status-toggle-btn ${doctor.status === 'active' ? 'inactive' : 'active'}`}
                        onClick={() => handleToggleStatus(doctor.id, doctor.status)}
                      >
                        {doctor.status === 'active' ? '🔴 Deactivate' : '🟢 Activate'}
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(doctor.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorManagement;