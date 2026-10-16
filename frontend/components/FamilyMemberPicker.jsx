"use client";

import { useEffect, useState } from "react";
import { FiUser, FiUsers, FiPlus, FiCheckCircle } from "react-icons/fi";
import apiClient from "@/lib/apiClient";
import { relationLabel, ageFromDob } from "@/lib/family";
import FamilyMemberForm from "@/components/FamilyMemberForm";

// "Who is this appointment for?" — Myself + family members + inline add.
// value = selected patient id (holder id = self). onChange(id, person)
export default function FamilyMemberPicker({ value, onChange }) {
  const [self, setSelf] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get("/patients/family");
      setSelf(res.data.self);
      setMembers(res.data.members || []);
      if (!value && res.data.self) onChange(res.data.self.id, res.data.self);
    } catch (e) {
      /* not logged in / old backend — picker stays hidden */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMember = async (data) => {
    setSaving(true);
    try {
      const res = await apiClient.post("/patients/family", data);
      const m = res.data.member;
      setMembers((list) => [...list, m]);
      onChange(m.id, m);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mb-5 h-20 animate-pulse rounded-2xl bg-slate-100" />;
  }
  if (!self) return null;

  const people = [{ ...self, _self: true }, ...members];

  return (
    <div className="mb-6">
      <p className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
        <FiUsers className="text-[#0D5CA8]" size={16} /> Who is this appointment for?
      </p>
      <p className="mb-3 text-[12.5px] text-slate-500">
        Book for yourself or any family member using the same number.
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {people.map((p) => {
          const active = String(value) === String(p.id);
          const age = ageFromDob(p.dob);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id, p)}
              className={`flex min-w-0 items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition ${
                active
                  ? "border-[#0D5CA8] bg-[#0D5CA8]/[0.05] ring-4 ring-[#0D5CA8]/10"
                  : "border-slate-200 bg-white hover:border-[#0D5CA8]/40"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                  active ? "bg-[#0D5CA8] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {(p.name || "?").trim().charAt(0).toUpperCase() || <FiUser />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-slate-900">
                  {p.name || "Me"}
                </span>
                <span className="block truncate text-[11.5px] text-slate-500">
                  {p._self ? "Myself" : relationLabel(p.relation)}
                  {age !== null ? ` · ${age} yrs` : ""}
                </span>
              </span>
              {active && <FiCheckCircle className="shrink-0 text-[#0D5CA8]" size={18} />}
            </button>
          );
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-3.5 py-3 text-[13px] font-semibold text-[#0D5CA8] transition hover:border-[#0D5CA8] hover:bg-[#0D5CA8]/[0.03]"
          >
            <FiPlus size={16} /> Add family member
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3">
          <FamilyMemberForm
            saving={saving}
            submitLabel="Add & select"
            onSubmit={addMember}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
    </div>
  );
}
