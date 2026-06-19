import React, { useState } from 'react';
import { Heart, MessageSquare, UserCircle, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName,  setLastName]  = useState(nameParts.slice(1).join(' ') || '');
  const [phone,     setPhone]     = useState(user?.phone || '');
  const [loading,   setLoading]   = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [pwLoading,       setPwLoading]       = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/users/profile/${user._id}`, {
        name:  `${firstName.trim()} ${lastName.trim()}`,
        phone,
      });
      if (res.data?.user) {
        setUser(res.data.user);
        toast.success('Profile updated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await api.post('/users/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/user/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><LayoutDashboard size={18} /> Overview</NavLink></li>
          <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><Heart size={18} /> Saved Properties</NavLink></li>
          <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><MessageSquare size={18} /> My Inquiries</NavLink></li>
          <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Profile Settings</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: '2rem' }}>Manage your account information</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <form onSubmit={handleUpdateProfile}>
            <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={user?.email || ''} disabled
                style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Email cannot be changed</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-control" value={firstName}
                  onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-control" value={lastName}
                  onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" className="form-control" placeholder="03001234567"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <form onSubmit={handlePasswordChange}>
            <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>

            <div className="form-group">
              <label>Current Password</label>
              <input type="password" className="form-control"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>New Password <span className="label-hint">min 8 characters</span></label>
              <input type="password" className="form-control"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
