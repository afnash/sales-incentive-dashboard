import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleModelService } from '../services/vehicleModelService';
import { incentiveSlabService } from '../services/incentiveSlabService';
import { salesService } from '../services/salesService';
import { isSupabaseConfigured } from '../lib/supabase';

function getMonthLabel(val) {
  const [y, m] = val.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function calcIncentive(totalQty, slabs) {
  if (!slabs.length || totalQty === 0) return { slab: null, rate: 0, total: 0 };
  const sorted = [...slabs].sort((a, b) => a.min_quantity - b.min_quantity);
  const slab = sorted.findLast(s => totalQty >= s.min_quantity) || null;
  if (!slab) return { slab: null, rate: 0, total: 0 };
  return { slab, rate: Number(slab.incentive_per_car), total: totalQty * Number(slab.incentive_per_car) };
}

export default function SalesDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [models, setModels] = useState([]);
  const [slabs, setSlabs] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
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

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, sRes] = await Promise.all([vehicleModelService.getAll(), incentiveSlabService.getAll()]);
    const ms = mRes.data || [];
    const ss = sRes.data || [];
    setModels(ms);
    setSlabs(ss);
    
    // Load saved quantities for this month
    const { data: sales } = await salesService.getByMonth(month);
    const q = {};
    ms.forEach(m => { q[m.id] = 0; });
    (sales || []).forEach(s => { q[s.vehicle_model_id] = s.quantity_sold; });
    setQuantities(q);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const totalQty = useMemo(() => Object.values(quantities).reduce((a, b) => a + Number(b || 0), 0), [quantities]);
  const { slab, rate, total } = useMemo(() => calcIncentive(totalQty, slabs), [totalQty, slabs]);

  const setQty = (id, val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setQuantities(q => ({ ...q, [id]: n }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [modelId, qty] of Object.entries(quantities)) {
      await salesService.upsert(month, modelId, Number(qty));
    }
    setSaving(false);
    setSaveMsg('Saved successfully!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <button className="hamburger" onClick={() => setSidebarOpen(v => !v)} style={{ zIndex: 110 }}>
        <span className="material-symbols-outlined">menu</span>
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>auto_graph</span>
          <div className="brand-name">SmartIncentive</div>
          <div className="brand-sub">Sales Portal</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="material-symbols-outlined">analytics</span> Performance Hub
          </div>
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
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>analytics</span>
            <span>Sales Performance Hub</span>
          </div>
          <div className="app-header-actions">
            <button className="icon-btn-header" onClick={toggleTheme} title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="btn-header-action" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>home</span> Portal Gateway
            </button>
          </div>
        </header>

        <main className="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
          {!isSupabaseConfigured && (
            <div className="alert-demo">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>info</span>
              <div>
                <strong>Demo Mode:</strong> Database offline. Entries will reset on refresh. Configure <code>.env</code> to connect Supabase.
              </div>
            </div>
          )}

          <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Dealer Sales Log
                {/* <span className="badge badge-toyota" style={{ padding: '0.35rem 0.65rem', fontSize: '0.65rem' }}>Toyota Team</span> */}
              </h1>
              <p>Log vehicle deliveries for the selected month and calculate earnings in real-time.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Month:</label>
              <input type="month" className="form-control-custom" style={{ width: 'auto' }}
                value={month} onChange={e => setMonth(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="row g-3">
              {/* Left Column: Sales entry table and then Chart */}
              <div className="col-lg-7 d-flex flex-column gap-3">
                <div className="table-card">
                  <div className="table-card-header">
                    <h5>Sales Entry — {getMonthLabel(month)}</h5>
                    <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '0.25rem' }}>cloud_upload</span>}
                      Save
                    </button>
                  </div>
                  {saveMsg && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '.65rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span> {saveMsg}
                    </div>
                  )}
                  {models.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                      <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border)' }}>directions_car</span>
                      <p className="mt-2">No vehicle models configured. Ask your system admin to populate the model list.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Model</th>
                            <th className="d-none d-md-table-cell">Variant</th>
                            <th className="text-center">Qty Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {models.map(m => (
                            <tr key={m.id}>
                              <td>
                                <strong>{m.model_name}</strong>
                                {m.base_suffix && <span className="text-muted ms-1" style={{ fontSize: '.8rem' }}>({m.base_suffix})</span>}
                                <div className="d-block d-md-none text-muted" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                  {m.variant || <span style={{ opacity: 0.5 }}>No variant</span>}
                                </div>
                              </td>
                              <td className="d-none d-md-table-cell">{m.variant || <span className="text-muted">—</span>}</td>
                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <button style={{ border: 'none', background: 'var(--surface-container)', color: 'var(--on-surface)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}
                                    onClick={() => setQty(m.id, (quantities[m.id] || 0) - 1)}>−</button>
                                  <input type="number" className="qty-input" min="0"
                                    value={quantities[m.id] || 0}
                                    onChange={e => setQty(m.id, e.target.value)} />
                                  <button style={{ border: 'none', background: 'var(--surface-container)', color: 'var(--on-surface)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}
                                    onClick={() => setQty(m.id, (quantities[m.id] || 0) + 1)}>+</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: 'var(--surface-container)' }}>
                            <td className="d-none d-md-table-cell"><strong>Total Vehicles Sold</strong></td>
                            <td className="d-table-cell d-md-none"><strong>Total Sold</strong></td>
                            <td className="d-none d-md-table-cell"></td>
                            <td className="text-center"><strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{totalQty}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                <ModelSalesChart models={models} quantities={quantities} />
              </div>

              {/* Right Column: Performance status, Payout Estimation and Slab Reference */}
              <div className="col-lg-5 d-flex flex-column gap-3">
                <SlabProgressCard totalQty={totalQty} slab={slab} rate={rate} slabs={slabs} />

                <div className="incentive-panel">
                  <h5>Incentive Payout Estimation</h5>

                  <div className="incentive-row">
                    <span>Month</span>
                    <span style={{ fontWeight: 600 }}>{getMonthLabel(month)}</span>
                  </div>
                  <div className="incentive-row">
                    <span>Total Vehicles Sold</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{totalQty}</span>
                  </div>
                  <div className="incentive-row">
                    <span>Applicable Slab</span>
                    {slab ? (
                      <span className="slab-active">
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>star</span>
                        {slab.min_quantity}{slab.max_quantity ? `–${slab.max_quantity}` : '+'} cars
                      </span>
                    ) : <span style={{ opacity: .6 }}>—</span>}
                  </div>
                  <div className="incentive-row">
                    <span>Rate Per Vehicle</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{rate ? fmt(rate) : '—'}</span>
                  </div>
                  <div className="incentive-row">
                    <span>Calculation Formula</span>
                    <span style={{ opacity: .75, fontSize: '.85rem', fontFamily: 'var(--font-mono)' }}>
                      {totalQty > 0 && rate ? `${totalQty} × ${fmt(rate)}` : '—'}
                    </span>
                  </div>

                  <div className="incentive-total">
                    <span style={{ fontWeight: 600, opacity: .8 }}>Total Incentive</span>
                    <span className="amount">{total ? fmt(total) : '₹0'}</span>
                  </div>
                </div>

                <div className="table-card">
                  <div className="table-card-header"><h5>All Incentive Slabs</h5></div>
                  <div className="table-responsive">
                    <table className="table mb-0" style={{ fontSize: '.85rem' }}>
                      <thead><tr><th>Range</th><th>Per Car</th><th>Status</th></tr></thead>
                      <tbody>
                        {slabs.map(s => {
                          const isActive = slab && slab.id === s.id;
                          return (
                            <tr key={s.id} style={{ background: isActive ? 'var(--primary-container)' : undefined, color: isActive ? 'var(--primary)' : undefined }}>
                              <td>{s.label || `${s.min_quantity}${s.max_quantity ? `–${s.max_quantity}` : '+'} cars`}</td>
                              <td style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(s.incentive_per_car)}</td>
                              <td>{isActive ? <span className="badge" style={{ backgroundColor: 'var(--success)', color: '#fff' }}>Active ✓</span> : <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>—</span>}</td>
                            </tr>
                          );
                        })}
                        {slabs.length === 0 && <tr><td colSpan={3} className="text-muted text-center">No slabs configured</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ModelSalesChart({ models, quantities }) {
  const chartData = models.map(m => ({
    name: m.model_name + (m.variant ? ` ${m.variant}` : ''),
    qty: quantities[m.id] || 0
  })).filter(d => d.qty > 0);

  if (chartData.length === 0) {
    return (
      <div className="chart-container text-center p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '220px', borderStyle: 'dashed' }}>
        <span className="material-symbols-outlined text-muted" style={{ fontSize: '2.5rem' }}>bar_chart</span>
        <h6 className="mt-2 fw-bold" style={{ color: 'var(--on-surface)' }}>Sales Distribution</h6>
        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Enter and save quantities sold above to generate analytics.</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map(d => d.qty), 1);
  const height = 180;
  const width = 500;
  const paddingLeft = 120;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 20;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const barHeight = Math.min(30, chartHeight / chartData.length - 8);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h6 className="fw-bold mb-0" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.2rem' }}>bar_chart</span>
          Model Sales Distribution
        </h6>
        <span className="badge" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}>
          {chartData.length} Models Active
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" style={{ width: '100%' }}>
          {/* Y Axis line */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} className="chart-axis-line" />
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const x = paddingLeft + chartWidth * ratio;
            const val = Math.round(maxVal * ratio);
            return (
              <g key={i}>
                <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} className="chart-grid-line" />
                <text x={x} y={height - 5} className="chart-text" textAnchor="middle" style={{ fontSize: '9px' }}>{val}</text>
              </g>
            );
          })}
          
          {/* Bars */}
          {chartData.map((d, idx) => {
            const y = paddingTop + idx * (chartHeight / chartData.length) + (chartHeight / chartData.length - barHeight) / 2;
            const barWidth = (d.qty / maxVal) * chartWidth;
            
            return (
              <g key={idx}>
                {/* Model Label */}
                <text x={paddingLeft - 10} y={y + barHeight / 2 + 4} className="chart-text" textAnchor="end" style={{ fontWeight: 600 }}>
                  {d.name.length > 15 ? `${d.name.slice(0, 13)}...` : d.name}
                </text>
                
                {/* Bar Background */}
                <rect x={paddingLeft} y={y} width={chartWidth} height={barHeight} fill="var(--surface-container)" rx="4" />
                
                {/* Bar Fill */}
                <rect x={paddingLeft} y={y} width={barWidth} height={barHeight} fill="url(#blueGrad)" className="chart-bar" rx="4" />
                
                {/* Quantity label */}
                <text x={paddingLeft + Math.max(10, barWidth - 8)} y={y + barHeight / 2 + 4} fill={barWidth > 30 ? "#ffffff" : "var(--on-surface)"} style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)' }} textAnchor={barWidth > 30 ? "end" : "start"}>
                  {d.qty}
                </text>
              </g>
            );
          })}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function SlabProgressCard({ totalQty, slab, rate, slabs }) {
  const nextSlab = useMemo(() => {
    if (!slabs.length) return null;
    const sorted = [...slabs].sort((a, b) => a.min_quantity - b.min_quantity);
    return sorted.find(s => s.min_quantity > totalQty) || null;
  }, [totalQty, slabs]);

  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;

  if (!slabs.length) return null;

  if (!nextSlab) {
    return (
      <div className="chart-container" style={{ borderLeft: '4px solid var(--success)' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-success" style={{ fontSize: '1.5rem' }}>military_tech</span>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--on-surface)' }}>Performance Tier Status</h6>
        </div>
        <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>Maximum Tier Reached! 🏆</div>
          <div className="text-muted mt-1" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            You are earning the maximum slab rate of <strong>{fmt(rate)}</strong> per vehicle. Keep up the phenomenal work!
          </div>
        </div>
        <div className="progress-bar-custom mt-3">
          <div className="progress-fill-custom" style={{ width: '100%', background: 'var(--success)' }}></div>
        </div>
      </div>
    );
  }

  const currentSlabMin = slab ? slab.min_quantity : 0;
  const targetQty = nextSlab.min_quantity;
  const needed = targetQty - totalQty;
  const percent = Math.min(100, Math.max(0, ((totalQty - currentSlabMin) / (targetQty - currentSlabMin)) * 100));
  
  return (
    <div className="chart-container">
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.5rem' }}>insights</span>
        <h6 className="fw-bold mb-0" style={{ color: 'var(--on-surface)' }}>Performance Tier Status</h6>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem' }}>
        Current Slab Progress: <strong style={{ color: 'var(--on-surface)' }}>{totalQty}</strong> / {targetQty} Vehicles
      </div>

      <div className="progress-bar-custom mb-3">
        <div className="progress-fill-custom" style={{ width: `${percent}%` }}></div>
      </div>

      <div className="p-3 rounded" style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.85rem' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.1rem' }}>arrow_circle_up</span>
          Next Level: {targetQty} Cars
        </div>
        <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
          Sell <strong>{needed}</strong> more {needed === 1 ? 'vehicle' : 'vehicles'} to unlock <strong>{fmt(nextSlab.incentive_per_car)}/car</strong> payout rate. That increases your commission by <strong>{fmt(nextSlab.incentive_per_car - (rate || 0))}</strong> for every vehicle sold this month!
        </p>
      </div>
    </div>
  );
}
