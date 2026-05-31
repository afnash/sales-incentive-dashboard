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
        <h1>Incentive Slabs</h1>
        <p>Configure tiered incentive rates based on quantity sold per month.</p>
      </div>

      <div className="row g-3 mb-4">
        {slabs.map(s => (
          <div key={s.id} className="col-md-4">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-label">Quantity Range</div>
                  <div className="stat-value" style={{ fontSize: '1.3rem' }}>
                    {s.min_quantity}{s.max_quantity ? `–${s.max_quantity}` : '+'} cars
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-label">Per Car</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{fmt(s.incentive_per_car)}</div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn-edit-sm" onClick={() => openEdit(s)}><i className="bi bi-pencil" /> Edit</button>
                <button className="btn-danger-sm" onClick={() => setDeleteId(s.id)}><i className="bi bi-trash" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h5>All Slabs <span className="badge bg-secondary ms-1">{slabs.length}</span></h5>
          <button className="btn-primary-custom" onClick={openAdd}><i className="bi bi-plus-lg" /> Add Slab</button>
        </div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner-border text-primary" /></div>
        ) : slabs.length === 0 ? (
          <div className="text-center p-5 text-muted">
            <i className="bi bi-layers" style={{ fontSize: '2rem' }} />
            <p className="mt-2">No incentive slabs configured yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr><th>#</th><th>Range</th><th>Min Qty</th><th>Max Qty</th><th>Incentive / Car</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {slabs.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td><span className="badge-slab">{s.label || `${s.min_quantity}${s.max_quantity ? `–${s.max_quantity}` : '+'} cars`}</span></td>
                    <td>{s.min_quantity}</td>
                    <td>{s.max_quantity ?? <span className="text-success fw-bold">∞ Unlimited</span>}</td>
                    <td><strong style={{ color: 'var(--accent)' }}>{fmt(s.incentive_per_car)}</strong></td>
                    <td>
                      <button className="btn-edit-sm me-2" onClick={() => openEdit(s)}><i className="bi bi-pencil" /> Edit</button>
                      <button className="btn-danger-sm" onClick={() => setDeleteId(s.id)}><i className="bi bi-trash" /> Delete</button>
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
                  <input className="form-control-custom" type="number" min="1" value={form.min_quantity}
                    onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))}
                    placeholder="e.g. 1"
                    style={{ borderColor: errors.min_quantity ? 'var(--danger)' : undefined }} />
                  {errors.min_quantity && <div style={{ color: 'var(--danger)', fontSize: '.8rem' }}>{errors.min_quantity}</div>}
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label>Max Quantity</label>
                  <input className="form-control-custom" type="number" min="1" value={form.max_quantity}
                    disabled={unlimited}
                    onChange={e => setForm(f => ({ ...f, max_quantity: e.target.value }))}
                    placeholder="e.g. 7"
                    style={{ borderColor: errors.max_quantity ? 'var(--danger)' : undefined, opacity: unlimited ? .5 : 1 }} />
                  {errors.max_quantity && <div style={{ color: 'var(--danger)', fontSize: '.8rem' }}>{errors.max_quantity}</div>}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={unlimited} onChange={e => { setUnlimited(e.target.checked); setForm(f => ({ ...f, max_quantity: '' })); }} />
                No upper limit (e.g., "8+ cars")
              </label>
            </div>

            <div className="form-group">
              <label>Incentive Per Car (₹) *</label>
              <input className="form-control-custom" type="number" min="0" value={form.incentive_per_car}
                onChange={e => setForm(f => ({ ...f, incentive_per_car: e.target.value }))}
                placeholder="e.g. 2000"
                style={{ borderColor: errors.incentive_per_car ? 'var(--danger)' : undefined }} />
              {errors.incentive_per_car && <div style={{ color: 'var(--danger)', fontSize: '.8rem' }}>{errors.incentive_per_car}</div>}
            </div>

            {form.min_quantity && form.incentive_per_car && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.85rem' }}>
                Preview: <strong>{form.min_quantity}{unlimited ? '+' : form.max_quantity ? `–${form.max_quantity}` : ''} cars</strong> →{' '}
                <strong style={{ color: 'var(--success)' }}>₹{Number(form.incentive_per_car).toLocaleString('en-IN')} / car</strong>
              </div>
            )}

            <div className="d-flex gap-2">
              <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-1" />}
                {editing ? 'Update' : 'Save'}
              </button>
              <button className="btn-edit-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🗑️</div>
            <h4 className="mt-2">Delete Slab?</h4>
            <p className="text-muted mb-3" style={{ fontSize: '.9rem' }}>This will remove the incentive tier permanently.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn-danger-sm" style={{ padding: '.6rem 1.5rem' }} onClick={() => handleDelete(deleteId)}>Delete</button>
              <button className="btn-edit-sm" style={{ padding: '.6rem 1.5rem' }} onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
