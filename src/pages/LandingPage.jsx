import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      const moveX = (x - 0.5) * 30;
      const moveY = (y - 0.5) * 30;
      
      const blobs = document.querySelectorAll('.bg-blob');
      blobs.forEach((blob, index) => {
        const factor = index === 0 ? 1 : -1.2;
        blob.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Theme Toggle Button */}
      <button className="theme-toggle-landing" onClick={toggleTheme} aria-label="Toggle Theme">
        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      {/* Background Interactive Blobs */}
      <div className="bg-blob blob-top"></div>
      <div className="bg-blob blob-bottom"></div>

      {/* Brand Header */}
      <div className="landing-brand">
        <div className="brand-icon-box">
          <span className="material-symbols-outlined">auto_graph</span>
        </div>
        <span className="brand-title">SmartIncentive Pro</span>
      </div>

      {/* Main Header */}
      <div className="landing-header">
        <h1>Incentive Intelligence</h1>
        <p>Select your access level to begin managing performance-based incentives and enterprise reporting.</p>
      </div>

      {/* Role selection Cards */}
      <div className="role-cards">
        {/* Administrator Portal */}
        <div className="glass-card" onClick={() => navigate('/admin')}>
          <span className="material-symbols-outlined card-decor-icon">settings</span>
          <div className="role-icon-container">
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>admin_panel_settings</span>
          </div>
          <h3>Administrator</h3>
          <p>Configure incentive rules, manage vehicle models, oversee performance, and update targets.</p>
          <button className="btn-role btn-admin-portal">
            Enter Admin Console
          </button>
        </div>

        {/* Sales Officer Portal */}
        <div className="glass-card" onClick={() => navigate('/sales')}>
          <span className="material-symbols-outlined card-decor-icon">person</span>
          <div className="role-icon-container">
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>directions_car</span>
          </div>
          <h3>Sales Officer</h3>
          <p>Track your daily sales, calculate potential payouts in real-time, and log monthly deliveries.</p>
          <button className="btn-role btn-sales-portal">
            Open Sales Dashboard
          </button>
        </div>
      </div>

      {/* Global Support Links */}
      <div className="landing-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        <a href="https://github.com/afnash" target='_blank'>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>help</span> Help Center
        </a>
        <p>
          <span style={{ color: 'var(--error-container)', fontWeight: 'bold' }}>Note:</span> This is a demonstration. Authentication is not enabled. Please configure your Supabase settings in the .env file if running in production.
        </p>
        <div className="app-footer" style={{ border: 'none', padding: '0.5rem 0', marginTop: '0.5rem' }}>
          <span>Developed by</span>
          <a href="https://afnash.vercel.app" target="_blank" rel="noopener noreferrer">afnash</a>
        </div>
      </div>

      {/* System Build info */}
      {/* <div className="version-tag">
        Build v2.4.0-Enterprise
      </div> */}
    </div>
  );
}
