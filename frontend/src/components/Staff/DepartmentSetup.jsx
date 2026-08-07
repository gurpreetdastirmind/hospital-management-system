// frontend/src/components/Staff/DepartmentSetup.jsx
import React, { useState } from 'react';
import api from '../../api';

const DepartmentSetup = ({ departments, onUpdate }) => {
  const [editingDept, setEditingDept] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    icon: '🏥',
    color: '#4CAF50',
    tokenPrefix: ''
  });
  const [saving, setSaving] = useState(false);

  const handleToggleDepartment = async (id, currentStatus) => {
    try {
      const response = await api.patch(`/api/departments/${id}/toggle`);
      if (response.status === 200) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling department:', error);
      alert('Error toggling department status');
    }
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let response;
      
      if (editingDept) {
        // Update existing department
        response = await api.put(`/api/departments/${editingDept.id}`, {
          ...formData,
          isOpen: editingDept.is_open
        });
      } else {
        // Create new department
        response = await api.post('/api/departments', {
          ...formData,
          isOpen: 1
        });
      }

      if (response.status === 200 || response.status === 201) {
        onUpdate();
        setShowAddForm(false);
        setEditingDept(null);
        setFormData({ name: '', room: '', icon: '🏥', color: '#4CAF50', tokenPrefix: '' });
        alert(editingDept ? 'Department updated successfully!' : 'Department added successfully!');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.message || 'Error saving department');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      room: dept.room,
      icon: dept.icon || '🏥',
      color: dept.color || '#4CAF50',
      tokenPrefix: dept.token_prefix || ''
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDept(null);
    setFormData({ name: '', room: '', icon: '🏥', color: '#4CAF50', tokenPrefix: '' });
  };

  return (
    <div className="department-setup">
      <div className="setup-header">
        <h2>⚙️ Department Setup</h2>
        <button 
          className="add-dept-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '➕ Add Department'}
        </button>
      </div>

      {showAddForm && (
        <div className="department-form">
          <h3>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
          <form onSubmit={handleSaveDepartment}>
            <div className="form-grid">
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., General Medicine"
                />
              </div>
              <div className="form-group">
                <label>Room *</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  required
                  placeholder="Room 12"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Token Prefix</label>
                <input
                  type="text"
                  value={formData.tokenPrefix}
                  onChange={(e) => setFormData({...formData, tokenPrefix: e.target.value})}
                  placeholder="G"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : editingDept ? 'Update Department' : 'Add Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="department-list">
        <table className="dept-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Icon</th>
              <th>Room</th>
              <th>Token Prefix</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-departments">
                  No departments configured. Add your first department above.
                </td>
              </tr>
            ) : (
              departments.map(dept => (
                <tr key={dept.id} className={dept.is_open === 0 ? 'closed' : ''}>
                  <td>{dept.name}</td>
                  <td className="icon-cell">{dept.icon || '🏥'}</td>
                  <td>{dept.room}</td>
                  <td>{dept.token_prefix || dept.name.substring(0, 1)}</td>
                  <td>
                    <span className={`availability-badge ${dept.is_open === 1 ? 'open' : 'closed'}`}>
                      {dept.is_open === 1 ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </td>
                  <td className="waiting-cell">
                    {dept.waiting || 0} waiting
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="toggle-btn"
                      onClick={() => handleToggleDepartment(dept.id, dept.is_open)}
                      style={{ 
                        backgroundColor: dept.is_open === 1 ? '#ff9800' : '#4CAF50',
                        color: 'white'
                      }}
                    >
                      {dept.is_open === 1 ? 'Close' : 'Open'}
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(dept)}
                    >
                      ✏️ Edit
                    </button>
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

export default DepartmentSetup;