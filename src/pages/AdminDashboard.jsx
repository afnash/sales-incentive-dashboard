import { useState } from 'react';
import { useNavigate, Routes, Route, NavLink } from 'react-router-dom';
import VehicleModels from '../components/admin/VehicleModels';
import IncentiveSlabs from '../components/admin/IncentiveSlabs';
import { isSupabaseConfigured } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>
        <i className="bi bi-list" />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-name">🚗 SmartIncentive</div>
          <div className="brand-sub">Admin Configuration Portal</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-speedometer2" /> Overview
          </NavLink>
          <NavLink to="/admin/vehicles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-car-front" /> Vehicle Models
          </NavLink>
          <NavLink to="/admin/slabs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-layers" /> Incentive Slabs
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="btn-back" onClick={() => navigate('/')}>
            <i className="bi bi-arrow-left" /> Back to Home
          </button>
        </div>
      </aside>

      <main className="main-content">
        {!isSupabaseConfigured && (
          <div className="alert-demo">
            <i className="bi bi-info-circle me-2" />
            <strong>Demo Mode:</strong> Supabase not configured. Data is stored locally and will reset on refresh.
            See <code>.env</code> to connect your database.
          </div>
        )}
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/vehicles" element={<VehicleModels />} />
          <Route path="/slabs" element={<IncentiveSlabs />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminOverview() {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Configure vehicle models and incentive slabs for sales officers.</p>
      </div>
      <div className="row g-3 mb-4">
        {[
          { icon: '🚗', label: 'Vehicle Models', desc: 'Add, edit, delete car models', path: '/admin/vehicles', color: '#eff6ff' },
          { icon: '📊', label: 'Incentive Slabs', desc: 'Configure tiered incentive rates', path: '/admin/slabs', color: '#f0fdf4' },
        ].map(c => (
          <div key={c.label} className="col-md-6">
            <div className="stat-card" style={{ cursor: 'pointer', background: c.color }} onClick={() => navigate(c.path)}>
              <div style={{ fontSize: '2.5rem' }}>{c.icon}</div>
              <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '.5rem' }}>{c.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '.25rem' }}>{c.desc}</div>
              <div style={{ marginTop: '1rem', color: 'var(--primary-light)', fontSize: '.85rem', fontWeight: 600 }}>
                Manage → 
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="table-card p-4">
        <h5 className="fw-bold mb-2">Quick Start Guide</h5>
        <ol style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 2 }}>
          <li>Go to <strong>Vehicle Models</strong> and add the car models your dealership sells.</li>
          <li>Go to <strong>Incentive Slabs</strong> and configure quantity-based incentive tiers.</li>
          <li>Sales officers can then log their monthly sales and see real-time incentive calculations.</li>
        </ol>
      </div>
    </>
  );
}
