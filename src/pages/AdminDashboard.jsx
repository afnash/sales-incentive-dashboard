import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Routes, Route, NavLink } from 'react-router-dom';
import VehicleModels from '../components/admin/VehicleModels';
import IncentiveSlabs from '../components/admin/IncentiveSlabs';
import { isSupabaseConfigured } from '../lib/supabase';
import { vehicleModelService } from '../services/vehicleModelService';
import { incentiveSlabService } from '../services/incentiveSlabService';
import { salesService } from '../services/salesService';

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
      {!sidebarOpen && (
        <button className="hamburger" onClick={() => setSidebarOpen(true)} style={{ zIndex: 110 }}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      )}

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
          <button className="btn-back" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">arrow_back</span> Back to Portal
          </button>
        </div>
      </aside>

      <div className="main-container-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <header className="app-header">
          <div className="app-header-title">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>settings</span>
            <span className="d-none d-sm-inline">Admin Control Panel</span>
          </div>
          <div className="app-header-actions">
            <button className="icon-btn-header" onClick={toggleTheme} title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="btn-header-action" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>home</span>
            </button>
          </div>
        </header>

        <main className="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
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
          {/* <footer className="app-footer">
            <span>Developed by</span>
            <a href="https://afnash.vercel.app" target="_blank" rel="noopener noreferrer">afnash</a>
          </footer> */}
        </main>
      </div>
    </div>
  );
}

const getModelSegment = (modelName) => {
  const name = modelName.toLowerCase();
  if (name.includes('camry') || name.includes('hybrid') || name.includes('prius')) {
    return 'Hybrid';
  }
  if (name.includes('fortuner') || name.includes('crysta') || name.includes('innova') || name.includes('hyryder') || name.includes('cruiser')) {
    return 'SUV';
  }
  return 'Hatchback / Sedan';
};

function AdminOverview() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [models, setModels] = useState([]);
  const [slabs, setSlabs] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [mRes, sRes, salesRes] = await Promise.all([
        vehicleModelService.getAll(),
        incentiveSlabService.getAll(),
        salesService.getByMonth(month)
      ]);
      setModels(mRes.data || []);
      setSlabs(sRes.data || []);
      setSales(salesRes.data || []);
      setLoading(false);
    }
    loadData();
  }, [month]);

  const processedData = useMemo(() => {
    const quantities = {};
    models.forEach(m => { quantities[m.id] = 0; });
    sales.forEach(s => {
      quantities[s.vehicle_model_id] = (quantities[s.vehicle_model_id] || 0) + s.quantity_sold;
    });

    const data = models.map(m => {
      const qty = quantities[m.id] || 0;
      const segment = getModelSegment(m.model_name);
      return {
        id: m.id,
        name: `${m.model_name}${m.variant ? ` ${m.variant}` : ''}`,
        segment,
        qty
      };
    });

    const filtered = segmentFilter === 'All' 
      ? data 
      : data.filter(d => d.segment === segmentFilter);

    const totalQtyAllSegments = data.reduce((sum, d) => sum + d.qty, 0);
    const sortedSlabs = [...slabs].sort((a, b) => a.min_quantity - b.min_quantity);
    const activeSlab = sortedSlabs.findLast(s => totalQtyAllSegments >= s.min_quantity) || null;
    const rate = activeSlab ? Number(activeSlab.incentive_per_car) : 0;

    const totalQty = filtered.reduce((sum, d) => sum + d.qty, 0);
    const totalPayout = totalQty * rate;

    let topModel = '—';
    let maxQty = 0;
    filtered.forEach(d => {
      if (d.qty > maxQty) {
        maxQty = d.qty;
        topModel = d.name;
      }
    });

    return {
      filteredData: filtered,
      allData: data,
      totalQty,
      totalPayout,
      topModel,
      rate,
      activeSlab
    };
  }, [models, slabs, sales, segmentFilter]);

  const segmentBreakdown = useMemo(() => {
    const segments = { SUV: 0, Hybrid: 0, 'Hatchback / Sedan': 0 };
    processedData.allData.forEach(d => {
      if (segments[d.segment] !== undefined) {
        segments[d.segment] += d.qty;
      }
    });

    const totalQtyAll = Object.values(segments).reduce((a, b) => a + b, 0);
    const rate = processedData.rate;

    return Object.entries(segments).map(([name, qty]) => {
      const pct = totalQtyAll > 0 ? Math.round((qty / totalQtyAll) * 100) : 0;
      return {
        name,
        qty,
        pct,
        payout: qty * rate
      };
    });
  }, [processedData.allData, processedData.rate]);

  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;

  const chartData = processedData.filteredData.filter(d => d.qty > 0);

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1>Toyota Intelligence & Analytics</h1>
            {/* <span className="badge badge-toyota" style={{ padding: '0.35rem 0.6rem', fontSize: '0.65rem' }}>GAZOO Performance</span> */}
          </div>
          <p>Analyze sales volume distribution, segment performances, and payouts.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <label style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Month:</label>
            <input type="month" className="form-control-custom" style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Segment filter buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {['All', 'SUV', 'Hybrid', 'Hatchback / Sedan'].map(seg => {
          const isActive = segmentFilter === seg;
          return (
            <button
              key={seg}
              onClick={() => setSegmentFilter(seg)}
              className={`btn ${isActive ? 'btn-filter-active-toyota' : 'btn-outline-secondary'}`}
              style={{
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 1rem',
                border: isActive ? 'none' : '1px solid var(--border)',
                backgroundColor: isActive ? undefined : 'var(--surface-container)',
                color: isActive ? undefined : 'var(--on-surface)'
              }}
            >
              {seg === 'All' ? 'All Segments' : `${seg}s`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          {/* Dashboard statistics card grid */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <div className="stat-card stat-card-toyota">
                <div>
                  <div className="stat-label">Total Sales ({segmentFilter})</div>
                  <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{processedData.totalQty}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                    Units delivered this month
                  </div>
                </div>
                <span className="material-symbols-outlined stat-icon toyota-accent">directions_car</span>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="stat-card stat-card-toyota">
                <div>
                  <div className="stat-label">Est. Incentives Paid</div>
                  <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(processedData.totalPayout)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                    Based on {fmt(processedData.rate)}/car slab rate
                  </div>
                </div>
                <span className="material-symbols-outlined stat-icon toyota-accent">payments</span>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="stat-card stat-card-toyota">
                <div>
                  <div className="stat-label">Top Selling Model</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {processedData.topModel}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                    Leader in segment category
                  </div>
                </div>
                <span className="material-symbols-outlined stat-icon toyota-accent">trophy</span>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="stat-card stat-card-toyota">
                <div>
                  <div className="stat-label">Avg Commission / Car</div>
                  <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>
                    {processedData.totalQty > 0 ? fmt(processedData.rate) : '₹0'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                    For achievements above slab targets
                  </div>
                </div>
                <span className="material-symbols-outlined stat-icon toyota-accent">speed</span>
              </div>
            </div>
          </div>

          {/* Charts and details */}
          <div className="row g-3 mb-4">
            {/* Visual graph */}
            <div className="col-lg-7">
              <div className="chart-card p-4 h-100" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
                    <span className="material-symbols-outlined toyota-accent">bar_chart</span>
                    Toyota Vehicle Performance ({segmentFilter})
                  </h5>
                  {chartData.length > 0 && (
                    <span className="badge bg-danger" style={{ backgroundColor: '#eb0a1e', fontWeight: 700 }}>
                      Active Log Data
                    </span>
                  )}
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center p-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '220px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    <span className="material-symbols-outlined text-muted" style={{ fontSize: '2.5rem' }}>directions_car</span>
                    <h6 className="mt-2 fw-bold" style={{ color: 'var(--on-surface)' }}>No Deliveries Logged</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Change the month filter or log deliveries to view charts.</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <svg viewBox="0 0 500 180" style={{ width: '100%' }}>
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const maxVal = Math.max(...chartData.map(c => c.qty), 1);
                        const x = 120 + 350 * ratio;
                        const labelVal = Math.round(maxVal * ratio);
                        return (
                          <g key={i}>
                            <line x1={x} y1={15} x2={x} y2={145} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4,4" opacity="0.4" />
                            <text x={x} y={160} fill="var(--on-surface-variant)" style={{ fontSize: '9px' }} textAnchor="middle">{labelVal}</text>
                          </g>
                        );
                      })}

                      {/* X-axis Label */}
                      <text x="295" y="175" fill="var(--on-surface-variant)" style={{ fontSize: '9px', fontWeight: 700 }} textAnchor="middle">Units Delivered</text>

                      {/* Bars */}
                      {chartData.map((d, idx) => {
                        const maxVal = Math.max(...chartData.map(c => c.qty), 1);
                        const y = 20 + idx * (120 / chartData.length);
                        const barWidth = (d.qty / maxVal) * 350;
                        const barHeight = Math.min(22, 110 / chartData.length - 4);

                        return (
                          <g key={d.id}>
                            <text x="110" y={y + barHeight / 2 + 3} fill="var(--on-surface)" style={{ fontSize: '9.5px', fontWeight: 600 }} textAnchor="end">
                              {d.name.length > 15 ? `${d.name.slice(0, 13)}...` : d.name}
                            </text>

                            {/* Bar background */}
                            <rect x="120" y={y} width="350" height={barHeight} fill="var(--surface-container)" rx="3" />
                            
                            {/* Bar fill */}
                            <rect x="120" y={y} width={barWidth} height={barHeight} fill="url(#toyotaGrad)" rx="3" style={{ transition: 'width 0.5s ease-in-out' }} />
                            
                            <text x={120 + Math.max(8, barWidth - 6)} y={y + barHeight / 2 + 3.5} fill={barWidth > 20 ? "#ffffff" : "var(--on-surface)"} style={{ fontSize: '9.5px', fontWeight: 800, fontFamily: 'var(--font-mono)' }} textAnchor={barWidth > 20 ? "end" : "start"}>
                              {d.qty}
                            </text>
                          </g>
                        );
                      })}

                      <defs>
                        <linearGradient id="toyotaGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#eb0a1e" />
                          <stop offset="100%" stopColor="#ff4d5a" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Segment breakdown */}
            <div className="col-lg-5">
              <div className="chart-card p-4 h-100" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h5 className="fw-bold mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
                  <span className="material-symbols-outlined toyota-accent">pie_chart</span>
                  Toyota Lineup Distribution
                </h5>

                <div className="d-flex flex-column gap-3">
                  {segmentBreakdown.map(seg => (
                    <div key={seg.name} className="p-3 rounded" style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--border)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>{seg.name}s</span>
                        <span className="fw-bold text-muted" style={{ fontSize: '0.85rem' }}>
                          {seg.qty} cars ({seg.pct}%)
                        </span>
                      </div>
                      <div className="progress-bar-custom mb-2">
                        <div className="progress-fill-custom" style={{ width: `${seg.pct}%`, background: '#eb0a1e' }}></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                        <span>Est. Commission Share</span>
                        <strong className="toyota-accent">{fmt(seg.payout)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick shortcuts to admin tables */}
          <div className="row g-3">
            {[
              { icon: 'directions_car', label: 'Configure Vehicle Catalog', desc: 'Define primary segments, variants, active status and suffixes.', path: '/admin/vehicles' },
              { icon: 'payments', label: 'Modify Incentive Tiers', desc: 'Adjust minimum quantity ranges, slab parameters, and payout coefficients.', path: '/admin/slabs' },
            ].map(c => (
              <div key={c.label} className="col-md-6">
                <div className="stat-card" style={{ cursor: 'pointer', minHeight: '130px', borderLeft: '4px solid var(--primary)' }} onClick={() => navigate(c.path)}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div className="stat-label">{c.label}</div>
                      <div style={{ color: 'var(--on-surface-variant)', fontSize: '.85rem', marginTop: '.35rem', lineHeight: '1.4' }}>{c.desc}</div>
                    </div>
                    <div className="toyota-accent" style={{ marginTop: '1rem', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                      Console Settings → 
                    </div>
                  </div>
                  <span className="material-symbols-outlined stat-icon text-primary" style={{ fontSize: '2rem' }}>{c.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
