import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/App.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar         from './components/Navbar';
import Footer         from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// ── Public pages ──────────────────────────────────────────────────────────────
import Home            from './pages/Home';
import PropertyListing from './pages/PropertyListing';
import PropertyDetail  from './pages/PropertyDetail';
import Login           from './pages/Login';
import Register        from './pages/Register';

// ── Shared pages ──────────────────────────────────────────────────────────────
import Comparison  from './pages/Comparison';
import InvestorHub from './pages/InvestorHub';

// ── User pages ────────────────────────────────────────────────────────────────
import UserDashboard   from './pages/user/Dashboard';
import UserInquiries   from './pages/user/Inquiries';
import UserProfile     from './pages/user/Profile';
import SavedProperties from './pages/user/SavedProperties';

// ── Investor pages ────────────────────────────────────────────────────────────
import InvestorDashboard from './pages/investor/Dashboard';

// ── Agent pages ───────────────────────────────────────────────────────────────
import AgentDashboard   from './pages/agent/Dashboard';
import AgentProperties  from './pages/agent/Properties';
import AgentAddProperty from './pages/agent/AddProperty';
import AgentInquiries   from './pages/agent/Inquiries';
import AgentProfile     from './pages/agent/Profile';

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard  from './pages/admin/Dashboard';
import AdminUsers      from './pages/admin/Users';
import AdminProperties from './pages/admin/Properties';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500 },
          }}
        />
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* ── Always public ──────────────────────────────────────── */}
              <Route path="/"          element={<Home />} />
              <Route path="/login"     element={<Login />} />
              <Route path="/register"  element={<Register />} />
              <Route path="/properties"  element={<PropertyListing />} />
              <Route path="/property/:id" element={<PropertyDetail />} />

              {/* ── Compare & Investor Hub ─────────────────────────────── */}
              <Route path="/comparison" element={
                <ProtectedRoute requiredRoles={['user', 'investor', 'agent', 'admin']} element={<Comparison />} />
              } />
              <Route path="/investor" element={
                <ProtectedRoute requiredRoles={['user', 'investor', 'admin']} element={<InvestorHub />} />
              } />

              {/* ── User routes ─────────────────────────────────────────── */}
              <Route path="/user/dashboard" element={
                <ProtectedRoute requiredRoles={['user', 'investor']} element={<UserDashboard />} />
              } />
              <Route path="/user/inquiries" element={
                <ProtectedRoute requiredRoles={['user', 'investor']} element={<UserInquiries />} />
              } />
              <Route path="/user/saved" element={
                <ProtectedRoute requiredRoles={['user', 'investor']} element={<SavedProperties />} />
              } />
              <Route path="/user/profile" element={
                <ProtectedRoute requiredRoles={['user', 'investor']} element={<UserProfile />} />
              } />

              {/* ── Investor routes ─────────────────────────────────────── */}
              <Route path="/investor/dashboard" element={
                <ProtectedRoute requiredRole="investor" element={<InvestorDashboard />} />
              } />

              {/* ── Agent routes ─────────────────────────────────────────── */}
              <Route path="/agent/dashboard" element={
                <ProtectedRoute requiredRole="agent" element={<AgentDashboard />} />
              } />
              <Route path="/agent/properties" element={
                <ProtectedRoute requiredRole="agent" element={<AgentProperties />} />
              } />
              <Route path="/agent/add-property" element={
                <ProtectedRoute requiredRole="agent" element={<AgentAddProperty />} />
              } />
              <Route path="/agent/inquiries" element={
                <ProtectedRoute requiredRole="agent" element={<AgentInquiries />} />
              } />
              <Route path="/agent/profile" element={
                <ProtectedRoute requiredRole="agent" element={<AgentProfile />} />
              } />

              {/* ── Admin routes ─────────────────────────────────────────── */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin" element={<AdminDashboard />} />
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin" element={<AdminUsers />} />
              } />
              <Route path="/admin/properties" element={
                <ProtectedRoute requiredRole="admin" element={<AdminProperties />} />
              } />

              {/* ── 404 ──────────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
