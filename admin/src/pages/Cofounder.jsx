import { useEffect, useState } from "react";
import cofounderClient, {
  getCofounderKey,
  setCofounderKey,
  clearCofounderKey,
} from "../api/cofounderClient";
import FamilyMemberSelect from "../components/FamilyMemberSelect";

const PATIENT_TYPE_OPTIONS = [
  { value: "new", label: "New (patients table)" },
  { value: "old", label: "Old / Backdated (new_patinet table)" },
];
const calculateAge = (dob) => {
  if (!dob) return "—";

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return `${age} Years`;
};

const formatDate = (date) => {
  if (!date || date === "0000-00-00") return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "—";

  const [hourStr, minute] = String(time).split(":");
  let hour = Number(hourStr);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${ampm}`;
};

const capitalize = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
function PatientTypeToggle({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">Patient Type</label>
      <div className="flex gap-2">
        {PATIENT_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${
              value === opt.value
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Cofounder() {
  const [key, setKey] = useState(getCofounderKey());
  const [unlocked, setUnlocked] = useState(!!getCofounderKey());
  const [tab, setTab] = useState("patient");

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4">Compounder Access</h1>
          <input
            className="input w-full mb-4"
            type="password"
            placeholder="Secret key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            className="btn-primary w-full"
            onClick={() => {
              setCofounderKey(key);
              setUnlocked(true);
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Compounder Panel</h1>
          <button
            className="text-sm text-slate-500 underline"
            onClick={() => {
              clearCofounderKey();
              setUnlocked(false);
            }}
          >
            Lock
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {["patient", "appointment", "medical"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
            >
              {t === "patient"
                ? "Add Patient"
                : t === "appointment"
                  ? "Book / Backdate Appointment"
                  : "Medical History & Prescriptions"}
            </button>
          ))}
        </div>

        {tab === "patient" && <AddPatientForm />}
        {tab === "appointment" && <BookAppointmentForm />}
        {tab === "medical" && <MedicalManager />}
      </div>
    </div>
  );
}

function AddPatientForm() {
  const [patientType, setPatientType] = useState("new");

  const initialForm = {
    patient_id: "",
    name: "",
    father_husband_name: "",
    mobile: "",
    email: "",
    gender: "",
    dob: "",
    nationality: "",
    marital_status: "",
    address: "",
    permanent_address: "",
    permanent_pincode: "",
    local_address: "",
    local_pincode: "",
    referred_by: "",
    referrer_name: "",
    referrer_address: "",
  };

  const [form, setForm] = useState(initialForm);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async () => {
    setMsg("");

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setMsg("Valid 10-digit mobile number required");
      return;
    }

    setSaving(true);

    try {
      const res = await cofounderClient.post("/patients", {
        ...form,
        patient_type: patientType,
      });

      setMsg(
        `Patient added (${res.data.patient_type}) — Patient ID: ${
          res.data.patient_id || res.data.id
        }`,
      );

      setForm(initialForm);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to add patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 space-y-6 max-w-3xl">
      <PatientTypeToggle value={patientType} onChange={setPatientType} />

      {/* Patient ID */}
      {patientType === "new" ? (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Patient ID (Optional)
          </label>

          <input
            className="input w-full"
            type="text"
            placeholder="e.g. 001, 102, PAT-001"
            value={form.patient_id}
            onChange={(e) => updateField("patient_id", e.target.value)}
          />

          <p className="text-xs text-slate-400 mt-1">
            Leave blank to generate automatically.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Old patient — ID auto-generated as PATxxxx.
        </p>
      )}

      {/* Personal Details */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Personal Details
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input
              className="input w-full"
              placeholder="Patient name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </Field>

          <Field label="Father's / Husband's Name">
            <input
              className="input w-full"
              placeholder="Father's / husband's name"
              value={form.father_husband_name}
              onChange={(e) =>
                updateField("father_husband_name", e.target.value)
              }
            />
          </Field>

          <Field label="Mobile Number">
            <input
              className="input w-full"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit mobile"
              value={form.mobile}
              onChange={(e) =>
                updateField("mobile", e.target.value.replace(/\D/g, ""))
              }
            />
          </Field>

          <Field label="Email">
            <input
              className="input w-full"
              type="email"
              placeholder="patient@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </Field>

          <Field label="Gender">
            <select
              className="input w-full"
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Date of Birth">
            <input
              className="input w-full"
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
            />
          </Field>

          <Field label="Nationality">
            <input
              className="input w-full"
              placeholder="e.g. Indian"
              value={form.nationality}
              onChange={(e) => updateField("nationality", e.target.value)}
            />
          </Field>

          <Field label="Marital Status">
            <select
              className="input w-full"
              value={form.marital_status}
              onChange={(e) => updateField("marital_status", e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="married">Married</option>
              <option value="unmarried">Unmarried</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Address Details */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Address Details
        </p>

        <div className="space-y-4">
          <Field label="Old / General Address">
            <textarea
              className="input w-full resize-none"
              rows={2}
              placeholder="General address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Permanent Address">
              <textarea
                className="input w-full resize-none"
                rows={3}
                placeholder="Permanent address"
                value={form.permanent_address}
                onChange={(e) =>
                  updateField("permanent_address", e.target.value)
                }
              />
            </Field>

            <Field label="Permanent Pin Code">
              <input
                className="input w-full"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="110025"
                value={form.permanent_pincode}
                onChange={(e) =>
                  updateField(
                    "permanent_pincode",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
              />
            </Field>

            <Field label="Local Address">
              <textarea
                className="input w-full resize-none"
                rows={3}
                placeholder="Local / current address"
                value={form.local_address}
                onChange={(e) => updateField("local_address", e.target.value)}
              />
            </Field>

            <Field label="Local Pin Code">
              <input
                className="input w-full"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="110025"
                value={form.local_pincode}
                onChange={(e) =>
                  updateField(
                    "local_pincode",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Referral Details */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Referral Details
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Referred By">
            <select
              className="input w-full"
              value={form.referred_by}
              onChange={(e) => {
                const value = e.target.value;

                setForm((prev) => ({
                  ...prev,
                  referred_by: value,
                  ...(value === "self"
                    ? {
                        referrer_name: "",
                        referrer_address: "",
                      }
                    : {}),
                }));
              }}
            >
              <option value="">Select</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital</option>
              <option value="organisation">Organisation</option>
              <option value="self">Self</option>
            </select>
          </Field>

          {form.referred_by && form.referred_by !== "self" && (
            <Field label="Referrer Name">
              <input
                className="input w-full"
                placeholder="Doctor / Hospital / Organisation"
                value={form.referrer_name}
                onChange={(e) => updateField("referrer_name", e.target.value)}
              />
            </Field>
          )}
        </div>

        {form.referred_by && form.referred_by !== "self" && (
          <div className="mt-4">
            <Field label="Referrer Address">
              <textarea
                className="input w-full resize-none"
                rows={3}
                placeholder="Referrer address"
                value={form.referrer_address}
                onChange={(e) =>
                  updateField("referrer_address", e.target.value)
                }
              />
            </Field>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        className="btn-primary"
        onClick={submit}
        disabled={saving}
      >
        {saving ? "Adding…" : "Add Patient"}
      </button>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}

function BookAppointmentForm() {
  const [patientType, setPatientType] = useState("new");
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsChecked, setSlotsChecked] = useState(false);
  const [msg, setMsg] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [familySel, setFamilySel] = useState({ member_patient_id: "", new_member: null, _adding: false });

  const initialForm = {
    patient_name: "",
    patient_mobile: "",
    manual_patient_id: "",

    patient_email: "",
    patient_gender: "",
    patient_father_husband_name: "",
    patient_dob: "",
    patient_nationality: "",
    patient_marital_status: "",

    patient_address: "",
    patient_permanent_address: "",
    patient_permanent_pincode: "",
    patient_local_address: "",
    patient_local_pincode: "",

    patient_referred_by: "",
    patient_referrer_name: "",
    patient_referrer_address: "",

    clinic_id: "",
    doctor_id: "",
    appointment_date: "",
    start_time: "",
    reason: "",
    is_free: false,
    payment_method: "pending",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    cofounderClient
      .get("/doctors")
      .then((r) => setDoctors(r.data.doctors || []))
      .catch(() => {});

    cofounderClient
      .get("/clinics")
      .then((r) => setClinics(r.data.clinics || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.doctor_id || !form.clinic_id || !form.appointment_date) {
      setSlots([]);
      setSlotsChecked(false);
      return;
    }

    fetchSlots();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.doctor_id, form.clinic_id, form.appointment_date, patientType]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchSlots = async () => {
    if (!form.doctor_id || !form.clinic_id || !form.appointment_date) {
      return;
    }

    setMsg("");
    setSlotsLoading(true);
    setSlotsChecked(false);

    try {
      const res = await cofounderClient.get("/appointments/available-slots", {
        params: {
          doctor_id: form.doctor_id,
          clinic_id: form.clinic_id,
          date: form.appointment_date,
          patient_type: patientType,
        },
      });

      const list =
        res.data?.slots ||
        res.data?.available_slots ||
        res.data?.data?.slots ||
        (Array.isArray(res.data) ? res.data : []) ||
        [];

      setSlots(list);

      setForm((current) =>
        list.includes(current.start_time)
          ? current
          : {
              ...current,
              start_time: "",
            },
      );
    } catch (err) {
      setSlots([]);

      setMsg(err.response?.data?.message || "Failed to load slots");
    } finally {
      setSlotsLoading(false);
      setSlotsChecked(true);
    }
  };

  const submit = async () => {
    setMsg("");

    if (!/^[6-9]\d{9}$/.test(form.patient_mobile)) {
      setMsg("Valid 10-digit patient mobile number required");
      return;
    }

    if (!form.clinic_id) {
      setMsg("Select clinic");
      return;
    }

    if (!form.doctor_id) {
      setMsg("Select doctor");
      return;
    }

    if (!form.appointment_date) {
      setMsg("Select appointment date");
      return;
    }

    if (!form.start_time) {
      setMsg("Select a time slot first");
      return;
    }

    if (familySel._adding && !familySel.new_member) {
      setMsg("Enter the family member's name");
      return;
    }

    try {
      const res = await cofounderClient.post("/appointments", {
        ...form,
        patient_type: patientType,
        member_patient_id: familySel.member_patient_id || undefined,
        new_member: familySel.new_member || undefined,
      });

      setMsg(
        `Appointment booked (${res.data.patient_type}) — code ${res.data.appointment_code}`,
      );

      setForm((current) => ({
        ...initialForm,

        // optionally retain clinic/doctor/date
        clinic_id: current.clinic_id,
        doctor_id: current.doctor_id,
        appointment_date: current.appointment_date,
      }));

      setSlots([]);
      setSlotsChecked(false);
      setShowExtraFields(false);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to book appointment");
    }
  };

  return (
    <div className="card p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>

        <p className="text-xs text-slate-400 mt-1">
          Backdating allowed up to 1 year in the past.
        </p>
      </div>

      <PatientTypeToggle
        value={patientType}
        onChange={(value) => {
          setPatientType(value);

          setForm((current) => ({
            ...current,
            start_time: "",
            manual_patient_id: value === "old" ? "" : current.manual_patient_id,
          }));
        }}
      />

      {/* Patient basic details */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Patient
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Only mobile is required. Other patient details are optional.
          </p>
        </div>

        {patientType === "new" && (
          <Field label="Patient ID (Optional)">
            <input
              className="input w-full"
              type="text"
              placeholder="e.g. 001, 102, PAT-001"
              value={form.manual_patient_id}
              onChange={(e) => updateField("manual_patient_id", e.target.value)}
            />

            <p className="text-xs text-slate-400 mt-1">
              Leave blank to generate automatically.
            </p>
          </Field>
        )}

        {patientType === "old" && (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">
              Old patient — ID auto-generated as PATxxxx if patient is not found
              by mobile.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Patient Name">
            <input
              className="input w-full"
              placeholder="Patient name"
              value={form.patient_name}
              onChange={(e) => updateField("patient_name", e.target.value)}
            />
          </Field>

          <Field label="Patient Mobile *">
            <input
              className="input w-full"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit mobile"
              value={form.patient_mobile}
              onChange={(e) =>
                updateField("patient_mobile", e.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
        </div>

        <FamilyMemberSelect
          client={cofounderClient}
          mobile={form.patient_mobile}
          patientType={patientType}
          value={familySel}
          onChange={setFamilySel}
          onHolder={(h) => {
            if (h?.name) setForm((f) => (f.patient_name ? f : { ...f, patient_name: h.name }));
          }}
        />

        <button
          type="button"
          onClick={() => setShowExtraFields((current) => !current)}
          className="btn-outline inline-flex items-center gap-2"
        >
          {showExtraFields
            ? "Hide Patient Details"
            : "Add / Edit Patient Details"}
        </button>

        {showExtraFields && (
          <div className="border-t border-slate-100 pt-5 space-y-6">
            {/* Personal details */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Personal Details
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Father's / Husband's Name">
                  <input
                    className="input w-full"
                    placeholder="Father's / husband's name"
                    value={form.patient_father_husband_name}
                    onChange={(e) =>
                      updateField("patient_father_husband_name", e.target.value)
                    }
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="input w-full"
                    type="email"
                    placeholder="patient@example.com"
                    value={form.patient_email}
                    onChange={(e) =>
                      updateField("patient_email", e.target.value)
                    }
                  />
                </Field>

                <Field label="Gender">
                  <select
                    className="input w-full"
                    value={form.patient_gender}
                    onChange={(e) =>
                      updateField("patient_gender", e.target.value)
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Date of Birth">
                  <input
                    className="input w-full"
                    type="date"
                    value={form.patient_dob}
                    onChange={(e) => updateField("patient_dob", e.target.value)}
                  />
                </Field>

                <Field label="Nationality">
                  <input
                    className="input w-full"
                    placeholder="e.g. Indian"
                    value={form.patient_nationality}
                    onChange={(e) =>
                      updateField("patient_nationality", e.target.value)
                    }
                  />
                </Field>

                <Field label="Marital Status">
                  <select
                    className="input w-full"
                    value={form.patient_marital_status}
                    onChange={(e) =>
                      updateField("patient_marital_status", e.target.value)
                    }
                  >
                    <option value="">Select status</option>
                    <option value="married">Married</option>
                    <option value="unmarried">Unmarried</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Address Details
              </p>

              <div className="space-y-4">
                <Field label="General / Old Address">
                  <textarea
                    className="input w-full resize-none"
                    rows={2}
                    placeholder="Address"
                    value={form.patient_address}
                    onChange={(e) =>
                      updateField("patient_address", e.target.value)
                    }
                  />
                </Field>

                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Permanent Address">
                    <textarea
                      className="input w-full resize-none"
                      rows={3}
                      placeholder="Permanent address"
                      value={form.patient_permanent_address}
                      onChange={(e) =>
                        updateField("patient_permanent_address", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Permanent Pin Code">
                    <input
                      className="input w-full"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="110025"
                      value={form.patient_permanent_pincode}
                      onChange={(e) =>
                        updateField(
                          "patient_permanent_pincode",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                    />
                  </Field>

                  <Field label="Local Address">
                    <textarea
                      className="input w-full resize-none"
                      rows={3}
                      placeholder="Local / current address"
                      value={form.patient_local_address}
                      onChange={(e) =>
                        updateField("patient_local_address", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Local Pin Code">
                    <input
                      className="input w-full"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="110025"
                      value={form.patient_local_pincode}
                      onChange={(e) =>
                        updateField(
                          "patient_local_pincode",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Referral */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Referral Details
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Referred By">
                  <select
                    className="input w-full"
                    value={form.patient_referred_by}
                    onChange={(e) => {
                      const value = e.target.value;

                      setForm((current) => ({
                        ...current,
                        patient_referred_by: value,

                        ...(value === "self"
                          ? {
                              patient_referrer_name: "",
                              patient_referrer_address: "",
                            }
                          : {}),
                      }));
                    }}
                  >
                    <option value="">Select</option>
                    <option value="doctor">Doctor</option>
                    <option value="hospital">Hospital</option>
                    <option value="organisation">Organisation</option>
                    <option value="self">Self</option>
                  </select>
                </Field>

                {form.patient_referred_by &&
                  form.patient_referred_by !== "self" && (
                    <Field label="Referrer Name">
                      <input
                        className="input w-full"
                        placeholder="Doctor / Hospital / Organisation"
                        value={form.patient_referrer_name}
                        onChange={(e) =>
                          updateField("patient_referrer_name", e.target.value)
                        }
                      />
                    </Field>
                  )}
              </div>

              {form.patient_referred_by &&
                form.patient_referred_by !== "self" && (
                  <div className="mt-4">
                    <Field label="Referrer Address">
                      <textarea
                        className="input w-full resize-none"
                        rows={3}
                        placeholder="Referrer address"
                        value={form.patient_referrer_address}
                        onChange={(e) =>
                          updateField(
                            "patient_referrer_address",
                            e.target.value,
                          )
                        }
                      />
                    </Field>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Appointment details */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Appointment Details
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Clinic *">
            <select
              className="input w-full"
              value={form.clinic_id}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  clinic_id: e.target.value,
                  start_time: "",
                }))
              }
            >
              <option value="">Select clinic</option>

              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Doctor *">
            <select
              className="input w-full"
              value={form.doctor_id}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  doctor_id: e.target.value,
                  start_time: "",
                }))
              }
            >
              <option value="">Select doctor</option>

              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Appointment Date *">
            <input
              className="input w-full"
              type="date"
              value={form.appointment_date}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  appointment_date: e.target.value,
                  start_time: "",
                }))
              }
            />
          </Field>

          <Field label="Time Slot *">
            <select
              className="input w-full"
              value={form.start_time}
              onChange={(e) => updateField("start_time", e.target.value)}
            >
              <option value="">
                {slotsLoading ? "Loading…" : "Select slot"}
              </option>

              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={fetchSlots}
          disabled={slotsLoading}
        >
          {slotsLoading ? "Loading slots…" : "Reload slots"}
        </button>

        {slotsChecked && !slotsLoading && slots.length === 0 && (
          <p className="text-xs text-red-500">
            No slots available for this doctor/clinic/date.
          </p>
        )}

        <Field label="Reason">
          <input
            className="input w-full"
            placeholder="Reason for appointment"
            value={form.reason}
            onChange={(e) => updateField("reason", e.target.value)}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => updateField("is_free", e.target.checked)}
          />
          Free / no charge
        </label>
      </div>

      <button
        type="button"
        className="btn-primary w-full sm:w-auto"
        onClick={submit}
      >
        Book Appointment
      </button>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
// Reusable file uploader — uploads immediately on file select, hands the
// resulting Cloudinary/local URL back to the parent form's attachment list.
function AttachmentUploader({ folder, urls, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await cofounderClient.post(`/upload/${folder}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange([...urls, res.data.url]);
    } catch (e2) {
      setErr(e2.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeAt = (i) => onChange(urls.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <label className="text-xs text-slate-500">
        Attachments (photo / PDF)
      </label>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploading && <p className="text-xs text-slate-400">Uploading…</p>}
      {err && <p className="text-xs text-red-500">{err}</p>}
      {urls.length > 0 && (
        <ul className="space-y-1">
          {urls.map((u, i) => (
            <li
              key={u}
              className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1"
            >
              <a
                href={u}
                target="_blank"
                rel="noreferrer"
                className="truncate text-slate-700 underline"
              >
                {u}
              </a>
              <button className="text-red-500 ml-2" onClick={() => removeAt(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Renders saved attachment_urls as image thumbnails (click to open full size)
// or a plain file link when the URL isn't an image (e.g. PDF).
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;

function AttachmentGrid({ urls }) {
  const list = Array.isArray(urls) ? urls : [];
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {list.map((u, i) =>
        IMAGE_EXT_RE.test(u) ? (
          <a key={i} href={u} target="_blank" rel="noreferrer">
            <img
              src={u}
              alt="attachment"
              className="w-16 h-16 object-cover rounded-md border border-slate-200"
            />
          </a>
        ) : (
          <a
            key={i}
            href={u}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline bg-white border border-slate-200 rounded px-2 py-1"
          >
            File {i + 1}
          </a>
        ),
      )}
    </div>
  );
}

function MedicalManager() {
  const [patientType, setPatientType] = useState("new");
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [msg, setMsg] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const [appointmentId, setAppointmentId] = useState("");

  const [historyForm, setHistoryForm] = useState({
    title: "",
    diagnosis: "",
    treatment_notes: "",
    visit_date: "",
    attachment_urls: [],
  });
  const [rxForm, setRxForm] = useState({
    notes: "",
    prescribed_date: "",
    medicines_json: [],
    attachment_urls: [],
  });

  // Search by patient ID, mobile number, or name — scoped to selected patient_type table.
  const searchPatients = async () => {
    setMsg("");
    setSearched(true);
    setResults([]);
    const q = query.trim();
    if (!q) return;

    if (/^\d+$/.test(q)) {
      try {
        const res = await cofounderClient.get(`/cofounder/patients/${q}`, {
          params: { patient_type: patientType },
        });
        if (res.data?.patient) {
          setResults([res.data.patient]);
          return;
        }
      } catch (e) {
        // not a valid id — fall through to name/mobile search below
      }
    }

    try {
      const res = await cofounderClient.get("/cofounder/patients", {
        params: { search: q, patient_type: patientType },
      });
      setResults(res.data.patients || []);
    } catch (err) {
      setResults([]);
      setMsg(err.response?.data?.message || "Search failed");
    }
  };

  const selectPatient = (p) => {
    setPatientId(String(p.id));
    setResults([]);
    setSearched(false);
    setQuery("");
    setAppointmentId("");
    loadPatient(p.id);
  };

  const loadPatient = async (idOverride) => {
    const id = idOverride || patientId;
    setMsg("");
    try {
      const res = await cofounderClient.get(`/cofounder/patients/${id}`, {
        params: { patient_type: patientType },
      });
      setPatient(res.data);
      // keep current appointment selected if it still exists, else default to latest
      setAppointmentId((prev) => {
        const ids = (res.data.appointments || []).map((a) => String(a.id));
        if (prev && ids.includes(prev)) return prev;
        return ids[0] || "";
      });
    } catch (err) {
      setPatient(null);
      setMsg(err.response?.data?.message || "Patient not found");
    }
  };

  const addHistory = async () => {
    if (!appointmentId) {
      setMsg("Select an appointment first — history is logged per visit");
      return;
    }
    try {
      await cofounderClient.post("/medical-history", {
        ...historyForm,
        patient_id: patientId,
        appointment_id: appointmentId,
        patient_type: patientType,
      });
      setMsg("Medical history added");
      setHistoryForm({
        title: "",
        diagnosis: "",
        treatment_notes: "",
        visit_date: "",
        attachment_urls: [],
      });
      loadPatient();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const addPrescription = async () => {
    if (!appointmentId) {
      setMsg(
        "Select an appointment first — prescriptions are logged per visit",
      );
      return;
    }
    try {
      await cofounderClient.post("/prescriptions", {
        ...rxForm,
        patient_id: patientId,
        appointment_id: appointmentId,
        patient_type: patientType,
      });
      setMsg("Prescription added");
      setRxForm({
        notes: "",
        prescribed_date: "",
        medicines_json: [],
        attachment_urls: [],
      });
      loadPatient();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const appointmentLabel = (a) =>
    `${a.appointment_date} ${String(a.start_time).slice(0, 5)} · Dr. ${a.doctor_name} · ${a.clinic_name}`;

  const historyForAppt = (apptId) =>
    (patient?.history || []).filter(
      (h) => String(h.appointment_id) === String(apptId),
    );
  const rxForAppt = (apptId) =>
    (patient?.prescriptions || []).filter(
      (r) => String(r.appointment_id) === String(apptId),
    );

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-3 max-w-lg">
        <PatientTypeToggle
          value={patientType}
          onChange={(v) => {
            setPatientType(v);
            setPatient(null);
            setPatientId("");
            setAppointmentId("");
            setResults([]);
            setSearched(false);
          }}
        />

        <label className="text-xs text-slate-500">
          Search patient by ID, mobile number, or name
        </label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. 9876543210 or Ramesh or 42"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchPatients()}
          />
          <button className="btn-primary" onClick={searchPatients}>
            Search
          </button>
        </div>

        {results.length > 0 && (
          <div className="divide-y border rounded-lg">
            {results.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-3 py-2 hover:bg-slate-50"
                onClick={() => selectPatient(p)}
              >
                <p className="font-medium">{p.name || "(no name)"}</p>
                <p className="text-xs text-slate-500">
                  {p.mobile} · ID {p.patient_id || p.id}
                </p>
              </button>
            ))}
          </div>
        )}

        {searched && results.length === 0 && (
          <p className="text-sm text-slate-500">No patient found.</p>
        )}
      </div>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}

      {patient && (
        <>
          <div className="card p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
                  {patient.patient?.name?.[0]?.toUpperCase() || "P"}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {patient.patient?.name || "Unnamed Patient"}
                    </h3>

                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                        patient.patient?.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {patient.patient?.is_active ? "Active" : "Inactive"}
                    </span>

                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700">
                      {capitalize(patient.patient?.patient_type)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    {patient.patient?.mobile
                      ? `+91 ${patient.patient.mobile}`
                      : "No mobile number"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Patient ID:{" "}
                    <span className="font-medium text-slate-600">
                      {patient.patient?.patient_id ||
                        patient.patient?.id ||
                        "—"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 min-w-[250px]">
                <StatBox
                  label="Appointments"
                  value={patient.appointments?.length || 0}
                />

                <StatBox label="History" value={patient.history?.length || 0} />

                <StatBox
                  label="Prescriptions"
                  value={patient.prescriptions?.length || 0}
                />
              </div>
            </div>

            {/* Personal Information */}
            <SectionTitle title="Personal Information" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <InfoBox label="Full Name" value={patient.patient?.name} />

              <InfoBox
                label="Father's / Husband's Name"
                value={patient.patient?.father_husband_name}
              />

              <InfoBox
                label="Gender"
                value={capitalize(patient.patient?.gender)}
              />

              <InfoBox
                label="Date of Birth"
                value={formatDate(patient.patient?.dob)}
              />

              <InfoBox label="Age" value={calculateAge(patient.patient?.dob)} />

              <InfoBox
                label="Nationality"
                value={patient.patient?.nationality}
              />

              <InfoBox
                label="Marital Status"
                value={capitalize(patient.patient?.marital_status)}
              />

              <InfoBox label="Email" value={patient.patient?.email} />
            </div>

            {/* Contact & Address */}
            <SectionTitle title="Contact & Address" />

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Permanent Address
                </p>

                <p className="text-sm text-slate-700 leading-6 whitespace-pre-line">
                  {patient.patient?.permanent_address || "—"}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Pin Code:{" "}
                    <span className="font-semibold text-slate-700">
                      {patient.patient?.permanent_pincode || "—"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Local Address
                </p>

                <p className="text-sm text-slate-700 leading-6 whitespace-pre-line">
                  {patient.patient?.local_address || "—"}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Pin Code:{" "}
                    <span className="font-semibold text-slate-700">
                      {patient.patient?.local_pincode || "—"}
                    </span>
                  </p>
                </div>
              </div>

              {patient.patient?.address && (
                <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
                    Previous / General Address
                  </p>

                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {patient.patient.address}
                  </p>
                </div>
              )}
            </div>

            {/* Referral */}
            <SectionTitle title="Referral Information" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <InfoBox
                label="Referred By"
                value={capitalize(patient.patient?.referred_by)}
              />

              <InfoBox
                label="Referrer Name"
                value={
                  patient.patient?.referred_by === "self"
                    ? "Self"
                    : patient.patient?.referrer_name
                }
              />

              <InfoBox
                label="Referrer Address"
                value={
                  patient.patient?.referred_by === "self"
                    ? "—"
                    : patient.patient?.referrer_address
                }
              />
            </div>

            {/* Record */}
            <SectionTitle title="Record Information" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoBox label="Database ID" value={patient.patient?.id} />

              <InfoBox
                label="Patient ID"
                value={patient.patient?.patient_id || "Not assigned"}
              />

              <InfoBox
                label="Created"
                value={formatDate(patient.patient?.created_at)}
              />

              <InfoBox
                label="Last Updated"
                value={formatDate(patient.patient?.updated_at)}
              />
            </div>
          </div>

          <div className="card p-6 space-y-3 max-w-lg">
            <h4 className="font-semibold">Select Appointment (Visit)</h4>
            <p className="text-xs text-slate-400">
              History &amp; prescriptions are logged per visit, not against the
              patient directly.
            </p>
            <select
              className="input w-full"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              <option value="">Select appointment</option>
              {(patient.appointments || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {appointmentLabel(a)}
                </option>
              ))}
            </select>
            {(patient.appointments || []).length === 0 && (
              <p className="text-xs text-red-500">
                No appointments found for this patient — book one first.
              </p>
            )}
          </div>

    {appointmentId && (() => {
  const appt = (patient.appointments || []).find(
    (a) => String(a.id) === String(appointmentId),
  );

  if (!appt) return null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="font-bold text-slate-900">
            Visit Details
          </h4>

          <p className="text-xs text-slate-400 mt-1">
            Appointment #{appt.appointment_code}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            appt.status === "completed"
              ? "bg-green-50 text-green-700"
              : appt.status === "confirmed"
                ? "bg-blue-50 text-blue-700"
                : appt.status === "cancelled"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-700"
          }`}
        >
          {capitalize(appt.status)}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoBox
          label="Doctor"
          value={appt.doctor_name}
        />

        <InfoBox
          label="Clinic"
          value={appt.clinic_name}
        />

        <InfoBox
          label="Appointment Date"
          value={formatDate(appt.appointment_date)}
        />

        <InfoBox
          label="Time"
          value={`${formatTime(appt.start_time)} - ${formatTime(appt.end_time)}`}
        />

        <InfoBox
          label="Fee"
          value={`₹${Number(appt.fee_amount || 0).toLocaleString("en-IN")}`}
        />

        <InfoBox
          label="Final Amount"
          value={`₹${Number(appt.final_amount || 0).toLocaleString("en-IN")}`}
        />

        <InfoBox
          label="Payment"
          value={capitalize(appt.payment_status)}
        />

        <InfoBox
          label="Booked Via"
          value={capitalize(appt.booked_via)}
        />
      </div>

      {appt.reason && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">
            Reason
          </p>

          <p className="text-sm text-slate-700">
            {appt.reason}
          </p>
        </div>
      )}
    </div>
  );
})()}
        </>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
        {title}
      </p>

      <div className="h-px bg-slate-100 flex-1" />
    </div>
  );
}

function InfoBox({ label, value }) {
  const hasValue =
    value !== null && value !== undefined && String(value).trim() !== "";

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800 break-words whitespace-pre-line">
        {hasValue ? value : "—"}
      </p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>

      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}
