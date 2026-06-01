import { useState } from 'react';
import { useNavigate, Routes, Route, NavLink } from 'react-router-dom';
import VehicleModels from '../components/admin/VehicleModels';
import IncentiveSlabs from '../components/admin/IncentiveSlabs';
import { isSupabaseConfigured } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>
        <i className="bi bi-list" />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>auto_graph</span>
          <div className="brand-name">SmartIncentive</div>
          <div className="brand-sub">Admin Console</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">dashboard</span> Overview
          </NavLink>
          <NavLink to="/admin/vehicles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">directions_car</span> Vehicle Models
          </NavLink>
          <NavLink to="/admin/slabs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">payments</span> Incentive Slabs
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item theme-toggle-btn w-100 mx-0 mb-3 px-3 py-2" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </button>
          <button className="btn-back" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">arrow_back</span> Back to Portal
          </button>
        </div>
      </aside>

      <main className="main-content">
        {!isSupabaseConfigured && (
          <div className="alert-demo">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>info</span>
            <div>
              <strong>Demo Mode:</strong> Database offline. Changes will persist in memory only. Configure <code>.env</code> to connect Supabase.
            </div>
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
        <div>
          <h1>Admin Configuration Hub</h1>
          <p>Define enterprise vehicle lines, model configurations, and payout tiers.</p>
        </div>
      </div>
      <div className="row g-3 mb-4">
        {[
          { icon: 'directions_car', label: 'Vehicle Models', desc: 'Add, update and configure primary vehicle segments and standard variants.', path: '/admin/vehicles' },
          { icon: 'payments', label: 'Incentive Slabs', desc: 'Set cumulative volume slabs, scaling rates, and payout amounts.', path: '/admin/slabs' },
        ].map(c => (
          <div key={c.label} className="col-md-6">
            <div className="stat-card" style={{ cursor: 'pointer', minHeight: '160px' }} onClick={() => navigate(c.path)}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{c.label}</div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: '.9rem', marginTop: '.5rem', lineHeight: '1.4' }}>{c.desc}</div>
                </div>
                <div style={{ marginTop: '1.5rem', color: 'var(--primary-container)', fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  Manage Console → 
                </div>
              </div>
              <span className="material-symbols-outlined stat-icon" style={{ fontSize: '2rem' }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="table-card p-4">
        <h5 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>Quick Start Instructions</h5>
        <ol style={{ color: 'var(--on-surface-variant)', fontSize: '.9rem', lineHeight: 2.2 }}>
          <li>Navigate to <strong>Vehicle Models</strong> and update the model catalog.</li>
          <li>Set up <strong>Incentive Slabs</strong> to establish quantity targets and incentive tiers.</li>
          <li>Sales officers can log entries on the <strong>Performance Hub</strong> to see calculated earnings immediately.</li>
        </ol>
      </div>
    </>
  );
}
