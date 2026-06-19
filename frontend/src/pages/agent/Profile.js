import React, { useState } from 'react';
import { Building, PlusCircle, MessageSquare, UserCircle } from 'lucide-react';


import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/users/profile/${user._id}`, {
        firstName,
        lastName,
        phone,
        company
      });
      if (res.data) {
        setUser(res.data.user);
        toast.success('Agent profile updated successfully!');
      }
    } catch (err) {
      console.error('Agent Profile update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/agent/dashboard" className="sidebar-link"> Summary</NavLink></li>
          <li><NavLink to="/agent/properties" className="sidebar-link"><Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className="sidebar-link"><PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries" className="sidebar-link"><MessageSquare size={18} /> Inquiries</NavLink></li>
          <li><NavLink to="/agent/profile" className="sidebar-link active"><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Agent Profile Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Manage your account information, company name, and password.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          {/* Update profile details */}
          <form onSubmit={handleUpdateProfile}>
            <h3 style={{ marginBottom: '1.5rem' }}>Personal Info</h3>
            
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Company / Agency Name</label>
              <input
                type="text"
                className="form-control"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>

          {/* Change password details */}
          <form onSubmit={handlePasswordChange}>
            <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password (At least 8 chars)</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={passwordLoading}>
              {passwordLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
