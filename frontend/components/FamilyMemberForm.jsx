"use client";

import { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { RELATIONS } from "@/lib/family";

const input =
  "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0D5CA8] focus:bg-white focus:ring-4 focus:ring-[#0D5CA8]/10";

export default function FamilyMemberForm({ initial, onSubmit, onCancel, saving, submitLabel = "Save member" }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    relation: initial?.relation || "spouse",
    gender: initial?.gender || "",
    dob: initial?.dob ? String(initial.dob).slice(0, 10) : "",
  });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return setErr("Please enter the member's name");
    setErr("");
    try {
      await onSubmit({ ...form, name: form.name.trim(), gender: form.gender || null, dob: form.dob || null });
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex?.message || "Something went wrong");
    }
  };

  return (
    <div className="rounded-2xl border border-[#0D5CA8]/15 bg-[#0D5CA8]/[0.03] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">Full name *</span>
          <input className={input} value={form.name} onChange={set("name")} placeholder="e.g. Priya Sharma" />
        </label>
        <label>
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">Relation</span>
          <select className={input} value={form.relation} onChange={set("relation")}>
            {RELATIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">Gender</span>
          <select className={input} value={form.gender} onChange={set("gender")}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">Date of birth</span>
          <input type="date" className={input} value={form.dob} onChange={set("dob")} max={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>
      {err && <p className="mt-2 text-xs font-medium text-red-500">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D5CA8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D3365] disabled:opacity-60"
        >
          <FiCheck size={15} /> {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <FiX size={15} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
