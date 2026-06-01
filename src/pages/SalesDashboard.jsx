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
      <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}><span className="material-symbols-outlined">menu</span></button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)' }}>auto_graph</span>
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

      <main className="main-content">
        {!isSupabaseConfigured && (
          <div className="alert-demo">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>info</span>
            <div>
              <strong>Demo Mode:</strong> Database offline. Entries will reset on refresh. Configure <code>.env</code> to connect Supabase.
            </div>
          </div>
        )}

        <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h1>Performance Hub</h1>
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
            {/* Sales Input Table */}
            <div className="col-lg-7">
              <div className="table-card">
                <div className="table-card-header">
                  <h5>Sales Entry — {getMonthLabel(month)}</h5>
                  <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '0.25rem' }}>cloud_upload</span>}
                    Save
                  </button>
                </div>
                {saveMsg && (
                  <div style={{ background: '#f0fdf4', color: '#166534', padding: '.65rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                        <tr><th>Model</th><th>Variant</th><th className="text-center">Qty Sold</th></tr>
                      </thead>
                      <tbody>
                        {models.map(m => (
                          <tr key={m.id}>
                            <td><strong>{m.model_name}</strong>{m.base_suffix && <span className="text-muted ms-1" style={{ fontSize: '.8rem' }}>({m.base_suffix})</span>}</td>
                            <td>{m.variant || <span className="text-muted">—</span>}</td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <button style={{ border: 'none', background: '#eff4ff', color: 'var(--primary-container)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}
                                  onClick={() => setQty(m.id, (quantities[m.id] || 0) - 1)}>−</button>
                                <input type="number" className="qty-input" min="0"
                                  value={quantities[m.id] || 0}
                                  onChange={e => setQty(m.id, e.target.value)} />
                                <button style={{ border: 'none', background: 'var(--surface-container-high)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700, color: 'var(--primary-container)' }}
                                  onClick={() => setQty(m.id, (quantities[m.id] || 0) + 1)}>+</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'var(--surface-container)' }}>
                          <td colSpan={2}><strong>Total Vehicles Sold</strong></td>
                          <td className="text-center"><strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{totalQty}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Incentive Panel */}
            <div className="col-lg-5">
              <div className="incentive-panel mb-3">
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

              {/* Slab reference card */}
              <div className="table-card">
                <div className="table-card-header"><h5>All Incentive Slabs</h5></div>
                <div className="table-responsive">
                  <table className="table mb-0" style={{ fontSize: '.85rem' }}>
                    <thead><tr><th>Range</th><th>Per Car</th><th>Status</th></tr></thead>
                    <tbody>
                      {slabs.map(s => {
                        const isActive = slab && slab.id === s.id;
                        return (
                          <tr key={s.id} style={{ background: isActive ? 'var(--surface-container-high)' : undefined }}>
                            <td>{s.label || `${s.min_quantity}${s.max_quantity ? `–${s.max_quantity}` : '+'} cars`}</td>
                            <td style={{ color: 'var(--secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(s.incentive_per_car)}</td>
                            <td>{isActive ? <span className="badge bg-success">Active ✓</span> : <span className="badge bg-light text-muted">—</span>}</td>
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
  );
}
