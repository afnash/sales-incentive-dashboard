import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      <div className="text-center mb-2">
        <div className="landing-logo">Smart<span>Incentive</span></div>
        <p className="landing-subtitle">Vehicle Sales Incentive Management Platform</p>
      </div>

      <div className="role-cards">
        <div className="role-card" onClick={() => navigate('/admin')}>
          <div className="role-icon"></div>
          <h3>Admin Portal</h3>
          <p>Manage vehicle models, configure incentive slabs and view sales data.</p>
          <button className="btn-role">Enter Admin Portal →</button>
        </div>
        <div className="role-card" onClick={() => navigate('/sales')}>
          <div className="role-icon"></div>
          <h3>Sales Officer Portal</h3>
          <p>Log monthly vehicle sales and view real-time incentive calculations.</p>
          <button className="btn-role">Enter Sales Portal →</button>
        </div>
      </div>

      <p className="mt-4" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '.8rem' }}>
        No login required · Select a portal to continue
      </p>
    </div>
  );
}
