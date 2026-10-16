import { useEffect, useRef, useState } from "react";
import { FiUsers, FiUserPlus, FiCheckCircle, FiUser, FiX } from "react-icons/fi";

export const RELATIONS = [
  ["spouse", "Spouse"],
  ["son", "Son"],
  ["daughter", "Daughter"],
  ["father", "Father"],
  ["mother", "Mother"],
  ["brother", "Brother"],
  ["sister", "Sister"],
  ["grandfather", "Grandfather"],
  ["grandmother", "Grandmother"],
  ["other", "Other"],
];
export const relationLabel = (r) => RELATIONS.find(([v]) => v === r)?.[1] || r || "";

const emptyMember = { name: "", relation: "spouse", gender: "", dob: "" };

/**
 * "Appointment for" selector (holder / family member / new member) for a mobile number.
 * value    = { member_patient_id: id|"" , new_member: {...}|null }
 * onChange = (value) => void   -> spread into the create-appointment payload
 *            value._adding === true && !value.new_member  => "add member" open but name empty
 * onHolder = (holder|null) => void  (optional, e.g. to auto-fill holder name)
 * client   = axios instance (admin client or cofounderClient)
 * patientType = "new" | "old" (cofounder old flow uses new_patinet table)
 */
export default function FamilyMemberSelect({
  client,
  mobile,
  patientType = "new",
  value,
  onChange,
  onHolder,
  className = "",
}) {
  const [holder, setHolder] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyMember);
  const reqId = useRef(0);

  const valid = /^[6-9]\d{9}$/.test(mobile || "");
  const selectedId = value?.member_patient_id ?? "";
  const newMember = value?.new_member || null;

  useEffect(() => {
    setHolder(null);
    setMembers([]);
    setAdding(false);
    setDraft(emptyMember);
    onChange({ member_patient_id: "", new_member: null });
    if (!valid) return;

    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await client.get("/patients/family-lookup", {
          params: { mobile, patient_type: patientType },
        });
        if (id !== reqId.current) return;
        setHolder(res.data.holder || null);
        setMembers(res.data.members || []);
        onHolder?.(res.data.holder || null);
      } catch (e) {
        if (id === reqId.current) {
          setHolder(null);
          setMembers([]);
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, patientType]);

  if (!valid) return null;

  const pick = (id) => {
    setAdding(false);
    onChange({ member_patient_id: id, new_member: null, _adding: false });
  };

  const setD = (k, v) => {
    const next = { ...draft, [k]: v };
    setDraft(next);
    onChange({
      member_patient_id: "",
      _adding: true,
      new_member: next.name.trim()
        ? { ...next, name: next.name.trim(), gender: next.gender || null, dob: next.dob || null }
        : null,
    });
  };

  const chip = (active) =>
    `flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition ${
      active ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300"
    }`;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50/60 p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FiUsers className="text-brand-600" /> Appointment for
        </p>
        {loading ? (
          <span className="text-xs text-slate-400">Checking number…</span>
        ) : holder ? (
          <span className="text-xs text-slate-500">
            Registered · {members.length} family member{members.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-xs text-amber-600">New number — account will be created</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => pick("")} className={chip(!adding && !selectedId)}>
          <FiUser className="text-brand-600" />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              {holder?.name || "Account holder"}
            </span>
            <span className="block text-[11px] text-slate-500">Self (mobile owner)</span>
          </span>
          {!adding && !selectedId && <FiCheckCircle className="text-brand-600" />}
        </button>

        {members.map((m) => {
          const active = !adding && String(selectedId) === String(m.id);
          return (
            <button key={m.id} type="button" onClick={() => pick(m.id)} className={chip(active)}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-xs font-bold text-brand-700 ring-1 ring-slate-200">
                {(m.name || "?").charAt(0).toUpperCase()}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">{m.name}</span>
                <span className="block text-[11px] text-slate-500">
                  {relationLabel(m.relation)}
                  {m.patient_id ? ` · ID ${m.patient_id}` : ""}
                </span>
              </span>
              {active && <FiCheckCircle className="text-brand-600" />}
            </button>
          );
        })}

        {!adding ? (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setDraft(emptyMember);
              onChange({ member_patient_id: "", new_member: null, _adding: true });
            }}
            className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-400"
          >
            <FiUserPlus /> Add family member
          </button>
        ) : (
          <button
            type="button"
            onClick={() => pick("")}
            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white"
          >
            <FiX /> Cancel new member
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Member name *</label>
            <input
              className="input"
              value={draft.name}
              placeholder="Family member name"
              onChange={(e) => setD("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Relation</label>
            <select className="input" value={draft.relation} onChange={(e) => setD("relation", e.target.value)}>
              {RELATIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={draft.gender} onChange={(e) => setD("gender", e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" value={draft.dob} onChange={(e) => setD("dob", e.target.value)} />
          </div>
          <p className="text-[11px] text-slate-500 sm:col-span-2 lg:col-span-4">
            Member is saved under this mobile number when the appointment is created. Patient
            name / details above stay for the account holder.
          </p>
        </div>
      )}
    </div>
  );
}