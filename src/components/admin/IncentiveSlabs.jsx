import { useState, useEffect, useCallback } from 'react';
import { incentiveSlabService } from '../../services/incentiveSlabService';

const EMPTY_FORM = { min_quantity: '', max_quantity: '', incentive_per_car: '' };

export default function IncentiveSlabs() {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [unlimited, setUnlimited] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await incentiveSlabService.getAll();
    setSlabs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setUnlimited(false); setErrors({}); setShowModal(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setUnlimited(s.max_quantity == null);
    setForm({ min_quantity: s.min_quantity, max_quantity: s.max_quantity ?? '', incentive_per_car: s.incentive_per_car });
    setErrors({}); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.min_quantity) e.min_quantity = 'Required';
    if (!unlimited && !form.max_quantity) e.max_quantity = 'Required or check unlimited';
    if (!unlimited && Number(form.max_quantity) <= Number(form.min_quantity)) e.max_quantity = 'Max must be > Min';
    if (!form.incentive_per_car) e.incentive_per_car = 'Required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      min_quantity: Number(form.min_quantity),
      max_quantity: unlimited ? null : Number(form.max_quantity),
      incentive_per_car: Number(form.incentive_per_car),
    };
    if (editing) await incentiveSlabService.update(editing.id, payload);
    else await incentiveSlabService.create(payload);
    setSaving(false); setShowModal(false); load();
  };

  const handleDelete = async (id) => {
    await incentiveSlabService.delete(id);
    setDeleteId(null); load();
  };

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Incentive Slabs</h1>
          <p>Configure tiered payout rates scaling with sales volume targets.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {slabs.map(s => (
          <div key={s.id} className="col-md-4">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div style={{ flexGrow: 1 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="stat-label">Quantity Range</div>
                    <div className="stat-value" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>
                      {s.min_quantity}{s.max_quantity ? `–${s.max_quantity}` : '+'} cars
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stat-label">Per Car</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>{fmt(s.incentive_per_car)}</div>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-4">
                  <button className="btn-edit-sm" onClick={() => openEdit(s)}>Edit</button>
                  <button className="btn-danger-sm" onClick={() => setDeleteId(s.id)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h5 className="mb-0">All Tiers <span className="badge bg-secondary ms-1">{slabs.length}</span></h5>
          <button className="btn-primary-custom" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span> Add Slab
          </button>
        </div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner-border text-primary" /></div>
        ) : slabs.length === 0 ? (
          <div className="text-center p-5 text-muted">
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border)' }}>payments</span>
            <p className="mt-2">No incentive slabs configured yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Tier Label</th>
                  <th>Min Qty</th>
                  <th>Max Qty</th>
                  <th>Incentive / Car</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slabs.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-muted font-mono-data">{i + 1}</td>
                    <td><span className="badge-slab">{s.label || `${s.min_quantity}${s.max_quantity ? `–${s.max_quantity}` : '+'} cars`}</span></td>
                    <td className="font-mono-data">{s.min_quantity}</td>
                    <td className="font-mono-data">{s.max_quantity ?? <span className="text-success fw-bold font-mono-data">∞ Unlimited</span>}</td>
                    <td><strong style={{ color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>{fmt(s.incentive_per_car)}</strong></td>
                    <td>
                      <button className="btn-edit-sm me-2" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-danger-sm" onClick={() => setDeleteId(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h4>{editing ? 'Edit Incentive Slab' : 'Add Incentive Slab'}</h4>

            <div className="row g-2">
              <div className="col-6">
                <div className="form-group">
                  <label>Min Quantity *</label>
                  <input className="form-control-custom font-mono-data" type="number" min="1" value={form.min_quantity}
                    onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))}
                    placeholder="e.g. 1"
                    style={{ borderColor: errors.min_quantity ? 'var(--danger)' : undefined }} />
                  {errors.min_quantity && <div style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: '.25rem' }}>{errors.min_quantity}</div>}
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label>Max Quantity</label>
                  <input className="form-control-custom font-mono-data" type="number" min="1" value={form.max_quantity}
                    disabled={unlimited}
                    onChange={e => setForm(f => ({ ...f, max_quantity: e.target.value }))}
                    placeholder="e.g. 7"
                    style={{ borderColor: errors.max_quantity ? 'var(--danger)' : undefined, opacity: unlimited ? .5 : 1 }} />
                  {errors.max_quantity && <div style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: '.25rem' }}>{errors.max_quantity}</div>}
                </div>
              </div>
            </div>

            <div className="form-group my-3">
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', textTransform: 'none', fontWeight: 600 }}>
                <input type="checkbox" checked={unlimited} onChange={e => { setUnlimited(e.target.checked); setForm(f => ({ ...f, max_quantity: '' })); }} />
                No upper limit (e.g., "8+ cars")
              </label>
            </div>

            <div className="form-group">
              <label>Incentive Per Car (₹) *</label>
              <input className="form-control-custom font-mono-data" type="number" min="0" value={form.incentive_per_car}
                onChange={e => setForm(f => ({ ...f, incentive_per_car: e.target.value }))}
                placeholder="e.g. 2000"
                style={{ borderColor: errors.incentive_per_car ? 'var(--danger)' : undefined }} />
              {errors.incentive_per_car && <div style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: '.25rem' }}>{errors.incentive_per_car}</div>}
            </div>

            {form.min_quantity && form.incentive_per_car && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1.25rem', fontSize: '.85rem' }}>
                Preview: <strong>{form.min_quantity}{unlimited ? '+' : form.max_quantity ? `–${form.max_quantity}` : ''} cars</strong> →{' '}
                <strong style={{ color: 'var(--success)' }}>₹{Number(form.incentive_per_car).toLocaleString('en-IN')} / car</strong>
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-1" />}
                {editing ? 'Update Slab' : 'Save Slab'}
              </button>
              <button className="btn-edit-sm" style={{ background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 360, textAlign: 'center' }}>
            <span className="material-symbols-outlined text-danger" style={{ fontSize: '3rem' }}>delete_forever</span>
            <h4 className="mt-3 mb-2">Delete Slab?</h4>
            <p className="text-muted mb-4" style={{ fontSize: '.9rem' }}>Are you sure? This will remove this incentive payout tier permanently.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn-danger-sm px-4" style={{ padding: '.65rem 1.5rem' }} onClick={() => handleDelete(deleteId)}>Delete</button>
              <button className="btn-edit-sm px-4" style={{ padding: '.65rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
