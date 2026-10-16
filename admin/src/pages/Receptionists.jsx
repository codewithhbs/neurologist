import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';

const EMPTY_FORM = { name: '', mobile: '', clinic_id: '', is_active: 1 };

const Receptionists = () => {
  const [rows, setRows] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  /* ---------------- data ---------------- */

  const loadReceptionists = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/receptionists');
      setRows(data.receptionists || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load receptionists. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadClinics = async () => {
    try {
      const { data } = await client.get('/clinics');
      setClinics(data.clinics || data.data || []);
    } catch {
      setClinics([]);
    }
  };

  useEffect(() => {
    loadReceptionists();
    loadClinics();
  }, []);

  const flash = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------- derived ---------------- */

  const clinicOptions = useMemo(() => {
    if (clinics.length) return clinics.map((c) => ({ id: c.id, name: c.name }));
    const seen = new Map();
    rows.forEach((r) => {
      if (r.clinic_id && !seen.has(r.clinic_id)) seen.set(r.clinic_id, r.clinic_name || `Clinic #${r.clinic_id}`);
    });
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [clinics, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.name} ${r.mobile} ${r.clinic_name || ''}`.toLowerCase().includes(q)) return false;
      if (clinicFilter === 'unassigned' && r.clinic_id) return false;
      if (clinicFilter !== 'all' && clinicFilter !== 'unassigned' && String(r.clinic_id) !== clinicFilter) return false;
      if (statusFilter === 'active' && Number(r.is_active) !== 1) return false;
      if (statusFilter === 'inactive' && Number(r.is_active) === 1) return false;
      return true;
    });
  }, [rows, search, clinicFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => Number(r.is_active) === 1).length,
      inactive: rows.filter((r) => Number(r.is_active) !== 1).length,
      unassigned: rows.filter((r) => !r.clinic_id).length,
    }),
    [rows]
  );

  /* ---------------- actions ---------------- */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      mobile: row.mobile || '',
      clinic_id: row.clinic_id ? String(row.clinic_id) : '',
      is_active: Number(row.is_active) === 1 ? 1 : 0,
    });
    setFormError('');
    setShowForm(true);
  };

  const submitForm = async () => {
    const name = form.name.trim();
    const mobile = form.mobile.trim();

    if (!name) return setFormError('Enter the staff member’s name.');
    if (!/^[6-9]\d{9}$/.test(mobile)) return setFormError('Mobile must be 10 digits and start with 6-9.');

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        // send only whitelisted columns — the update endpoint builds SQL from the body keys
        await client.put(`/receptionists/${editing.id}`, {
          name,
          mobile,
          clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
          is_active: Number(form.is_active),
        });
        flash('Receptionist updated');
      } else {
        await client.post('/receptionists', {
          name,
          mobile,
          clinic_id: form.clinic_id ? Number(form.clinic_id) : null,
        });
        flash('Receptionist added');
      }
      setShowForm(false);
      loadReceptionists();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    const isActive = Number(row.is_active) === 1;
    try {
      if (isActive) {
        await client.delete(`/receptionists/${row.id}`);
        flash(`${row.name} deactivated`);
      } else {
        await client.put(`/receptionists/${row.id}`, { is_active: 1 });
        flash(`${row.name} reactivated`);
      }
      setConfirm(null);
      loadReceptionists();
    } catch (err) {
      flash(err?.response?.data?.message || 'Action failed', 'error');
      setConfirm(null);
    }
  };

  const fmtDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const initials = (name = '') =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  /* ---------------- ui ---------------- */

  const statCards = [
    { label: 'Total staff', value: stats.total, tone: 'text-slate-900' },
    { label: 'Active', value: stats.active, tone: 'text-emerald-600' },
    { label: 'Deactivated', value: stats.inactive, tone: 'text-rose-600' },
    { label: 'No clinic assigned', value: stats.unassigned, tone: 'text-amber-600' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Receptionists</h1>
            <p className="text-sm text-slate-500">Front-desk staff accounts and their clinic assignments.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1E3A8A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span> Add receptionist
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, mobile or clinic"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Clinic</label>
            <select
              value={clinicFilter}
              onChange={(e) => setClinicFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            >
              <option value="all">All clinics</option>
              <option value="unassigned">No clinic assigned</option>
              {clinicOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading receptionists…</div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <button onClick={loadReceptionists} className="mt-3 text-sm font-medium text-[#1D4ED8] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-600">
                {rows.length === 0 ? 'No receptionists yet.' : 'No receptionists match these filters.'}
              </p>
              {rows.length === 0 && (
                <button onClick={openCreate} className="mt-3 text-sm font-medium text-[#1D4ED8] hover:underline">
                  Add the first one
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Clinic</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last login</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const active = Number(r.is_active) === 1;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8]/10 text-xs font-semibold text-[#1E3A8A]">
                              {initials(r.name)}
                            </span>
                            <div>
                              <p className="font-medium text-slate-900">{r.name}</p>
                              <p className="text-xs text-slate-500">Added {fmtDate(r.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{r.mobile}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {r.clinic_name || <span className="text-amber-600">Not assigned</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(r.last_login)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(r)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirm(r)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                active
                                  ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && rows.length > 0 && (
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {rows.length} receptionists
          </p>
        )}
      </div>

      {/* create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editing ? 'Edit receptionist' : 'Add receptionist'}
                </h2>
                <p className="text-xs text-slate-500">They sign in with this mobile number.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
                  placeholder="Priya Sharma"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Mobile number</label>
                <input
                  value={form.mobile}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Clinic</label>
                <select
                  value={form.clinic_id}
                  onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
                >
                  <option value="">No clinic assigned</option>
                  {clinicOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {editing && (
                <label className="flex items-center gap-2 pt-1 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Number(form.is_active) === 1}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                  Account is active
                </label>
              )}

              {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add receptionist'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {Number(confirm.is_active) === 1 ? 'Deactivate account?' : 'Reactivate account?'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {Number(confirm.is_active) === 1
                ? `${confirm.name} will no longer be able to sign in to the reception app.`
                : `${confirm.name} will be able to sign in again with ${confirm.mobile}.`}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleActive(confirm)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
                  Number(confirm.is_active) === 1 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {Number(confirm.is_active) === 1 ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
};

export default Receptionists;