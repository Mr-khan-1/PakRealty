import React, { useState, useEffect } from 'react';

import { NavLink } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await api.get('/users/agents/list');
        setAgents(res.data.agents || []);
      } catch (err) {
        console.error('Error loading agents:', err);
        toast.error('Failed to load user accounts list');
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/admin/dashboard" className="sidebar-link"> System Stats</NavLink></li>
          <li><NavLink to="/admin/users" className="sidebar-link active">👥 User Accounts</NavLink></li>
          <li><NavLink to="/admin/properties" className="sidebar-link"> Moderation</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>User Accounts Management</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Overview of registered real estate agents on the platform.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No registered agent accounts found.
          </div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Company</th>
                <th style={{ padding: '1rem' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{agent.firstName} {agent.lastName}</td>
                  <td style={{ padding: '1rem' }}>{agent.email}</td>
                  <td style={{ padding: '1rem' }}>{agent.phone || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>{agent.company || 'Independent'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '600' }}>
                      AGENT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default Users;
