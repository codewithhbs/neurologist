import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUsers, FiUserPlus, FiTrash2 } from "react-icons/fi";
import { RELATIONS, relationLabel } from "./FamilyMemberSelect";

// Family list on patient detail page. family = rows from GET /patients/:id (holder first)
export default function FamilyCard({ client, patientId, family = [], onChanged }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "spouse", gender: "", dob: "" });

  const save = async () => {
    if (!form.name.trim()) return toast.error("Member name required");
    setSaving(true);
    try {
      await client.post(`/patients/${patientId}/family`, {
        ...form,
        gender: form.gender || null,
        dob: form.dob || null,
      });
      toast.success("Family member added");
      setAdding(false);
      setForm({ name: "", relation: "spouse", gender: "", dob: "" });
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!confirm(`Remove ${m.name}?`)) return;
    try {
      await client.delete(`/patients/${patientId}/family/${m.id}`);
      toast.success("Member removed");
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove");
    }
  };

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-brand-600" /> Family (same mobile)
          </h3>
          <p className="text-xs text-slate-400 mt-1">Account holder + members booked under this number</p>
        </div>
        {!adding && (
          <button className="btn-outline inline-flex items-center gap-2" onClick={() => setAdding(true)}>
            <FiUserPlus /> Add member
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {family.map((m) => {
          const isHolder = !m.parent_patient_id;
          const current = String(m.id) === String(patientId);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${current ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white ring-1 ring-slate-200 font-bold text-brand-700">
                {(m.name || "?").charAt(0).toUpperCase()}
              </span>
              <Link to={`/patients/${m.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{m.name || "—"}</div>
                <div className="text-[11px] text-slate-500">
                  {isHolder ? "Account holder" : relationLabel(m.relation)} · PT-{m.patient_id || m.id}
                </div>
              </Link>
              {!isHolder && (
                <button onClick={() => remove(m)} className="text-red-500 hover:text-red-600 p-1" title="Remove">
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t pt-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Relation</label>
            <select className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              {RELATIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
            <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save member"}</button>
            <button className="btn-outline" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
