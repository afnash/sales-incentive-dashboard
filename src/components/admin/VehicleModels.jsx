import { useState, useEffect, useCallback } from 'react';
import { vehicleModelService } from '../../services/vehicleModelService';

const EMPTY_FORM = { model_name: '', base_suffix: '', variant: '' };

export default function VehicleModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await vehicleModelService.getAll();
    if (!error) setModels(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ model_name: m.model_name, base_suffix: m.base_suffix || '', variant: m.variant || '' }); setErrors({}); setShowModal(true); };

  const validate = () => {
    const e = {};
    if (!form.model_name.trim()) e.model_name = 'Model name is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    if (editing) {
      await vehicleModelService.update(editing.id, form);
    } else {
      await vehicleModelService.create(form);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    await vehicleModelService.delete(id);
    setDeleteId(null);
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Vehicle Models</h1>
          <p>Manage model line lists and configurations for sales commissions.</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h5 className="mb-0">All Models <span className="badge bg-secondary ms-1">{models.length}</span></h5>
          <button className="btn-primary-custom" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span> Add Model
          </button>
        </div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner-border text-primary" /></div>
        ) : models.length === 0 ? (
          <div className="text-center p-5 text-muted">
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border)' }}>directions_car</span>
            <p className="mt-2">No vehicle models configured yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Model Name</th>
                  <th>Base Suffix</th>
                  <th>Variant</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-muted font-mono-data">{i + 1}</td>
                    <td><strong>{m.model_name}</strong></td>
                    <td>{m.base_suffix || <span className="text-muted">—</span>}</td>
                    <td>{m.variant || <span className="text-muted">—</span>}</td>
                    <td>
                      <button className="btn-edit-sm me-2" onClick={() => openEdit(m)}>
                        Edit
                      </button>
                      <button className="btn-danger-sm" onClick={() => setDeleteId(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h4>{editing ? 'Edit Vehicle Model' : 'Add Vehicle Model'}</h4>
            {['model_name', 'base_suffix', 'variant'].map(field => (
              <div className="form-group" key={field}>
                <label>{field === 'model_name' ? 'Model Name *' : field === 'base_suffix' ? 'Base Suffix' : 'Variant'}</label>
                <input
                  className="form-control-custom"
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'model_name' ? 'e.g. Fortuner' : field === 'base_suffix' ? 'e.g. GD6' : 'e.g. Legender'}
                  style={{ borderColor: errors[field] ? 'var(--danger)' : undefined }}
                />
                {errors[field] && <div style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: '.25rem' }}>{errors[field]}</div>}
              </div>
            ))}
            <div className="d-flex gap-2 mt-4">
              <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-1" />}
                {editing ? 'Update Model' : 'Save Model'}
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
            <h4 className="mt-3 mb-2">Delete Model?</h4>
            <p className="text-muted mb-4" style={{ fontSize: '.9rem' }}>Are you sure? This model will be permanently removed from the configuration lists.</p>
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
