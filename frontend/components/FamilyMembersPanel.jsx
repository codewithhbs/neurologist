"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiEdit3, FiTrash2, FiUsers, FiUser } from "react-icons/fi";
import apiClient from "@/lib/apiClient";
import { relationLabel, ageFromDob } from "@/lib/family";
import FamilyMemberForm from "@/components/FamilyMemberForm";

// Profile tab: manage family members of this account
export default function FamilyMembersPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "add" | memberId (edit)
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await apiClient.get("/patients/family");
      setMembers(res.data.members || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async (data) => {
    setSaving(true);
    try {
      if (mode === "add") {
        const res = await apiClient.post("/patients/family", data);
        setMembers((l) => [...l, res.data.member]);
        setMsg("Family member added");
      } else {
        const res = await apiClient.put(`/patients/family/${mode}`, data);
        setMembers((l) => l.map((m) => (m.id === mode ? res.data.member : m)));
        setMsg("Family member updated");
      }
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!confirm(`Remove ${m.name} from your family list?`)) return;
    try {
      await apiClient.delete(`/patients/family/${m.id}`);
      setMembers((l) => l.filter((x) => x.id !== m.id));
      setMsg("Family member removed");
    } catch (e) {
      alert(e.response?.data?.message || "Could not remove member");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Family Members</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Add your family once and book appointments for them from this same account.
          </p>
        </div>
        {mode === null && (
          <button onClick={() => { setMsg(""); setMode("add"); }} className="btn-primary">
            <FiPlus size={15} /> Add member
          </button>
        )}
      </div>

      {msg && <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">{msg}</p>}

      {mode === "add" && (
        <div className="mb-4">
          <FamilyMemberForm saving={saving} onSubmit={save} onCancel={() => setMode(null)} submitLabel="Add member" />
        </div>
      )}

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : members.length === 0 && mode !== "add" ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <FiUsers size={24} />
          </span>
          <p className="font-bold text-slate-900">No family members yet</p>
          <p className="max-w-xs text-sm text-slate-500">
            Add your spouse, kids or parents to book their appointments with your number.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) =>
            mode === m.id ? (
              <FamilyMemberForm
                key={m.id}
                initial={m}
                saving={saving}
                onSubmit={save}
                onCancel={() => setMode(null)}
                submitLabel="Update"
              />
            ) : (
              <div key={m.id} className="card flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 font-bold text-brand-600">
                  {(m.name || "").charAt(0).toUpperCase() || <FiUser />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {relationLabel(m.relation)}
                    {m.gender ? ` · ${m.gender}` : ""}
                    {ageFromDob(m.dob) !== null ? ` · ${ageFromDob(m.dob)} yrs` : ""}
                    {m.patient_id ? ` · ID ${m.patient_id}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => { setMsg(""); setMode(m.id); }}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  title="Edit"
                >
                  <FiEdit3 size={15} />
                </button>
                <button
                  onClick={() => remove(m)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                  title="Remove"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
