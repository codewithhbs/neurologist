"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiClipboard,
  FiUser,
  FiLogOut,
  FiClock,
  FiMapPin,
  FiX,
  FiPlus,
  FiInbox,
  FiActivity,
  FiPhone,
  FiMail,
  FiEdit3,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import Link from "next/link";
import apiClient, { getPatientToken, clearPatientToken } from "@/lib/apiClient";
import FamilyMembersPanel from "@/components/FamilyMembersPanel";
import { relationLabel } from "@/lib/family";

const TABS = [
  { key: "appointments", label: "Appointments", icon: FiCalendar },
  { key: "payments", label: "Payments", icon: FiCreditCard },
  { key: "history", label: "Medical History", icon: FiClipboard },
  { key: "prescriptions", label: "Prescriptions", icon: FiFileText },
  { key: "family", label: "Family Members", icon: FiUsers },
  { key: "profile", label: "My Profile", icon: FiUser },
];

const to12h = (t) => {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = +m[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
};

const prettyDate = (d) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("appointments");
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (!getPatientToken()) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const [me, appts, pays, hist, presc] = await Promise.all([
          apiClient.get("/auth/me"),
          apiClient.get("/patients/appointments/my"),
          apiClient.get("/patients/payments/my"),
          apiClient.get("/patients/medical-history"),
          apiClient.get("/patients/prescriptions"),
        ]);
        setPatient(me.data.patient);
        setAppointments(appts.data.appointments || []);
        setPayments(pays.data.payments || []);
        setHistory(hist.data.history || []);
        setPrescriptions(presc.data.prescriptions || []);
      } catch (e) {
        clearPatientToken();
        router.push("/login");
      }
      setReady(true);
    })();
  }, [router]);

  const cancelAppointment = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await apiClient.post(`/patients/appointments/${id}/cancel`, {});
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
      );
    } catch (e) {
      alert(e.response?.data?.message || "Failed to cancel");
    }
  };

  const logout = () => {
    clearPatientToken();
    router.push("/");
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = appointments.filter(
      (a) =>
        a.appointment_date >= today &&
        ["pending", "confirmed"].includes(a.status),
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return { upcoming, completed, totalPaid };
  }, [appointments, payments]);

  if (!ready) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="text-sm text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-slate-50 min-h-screen">
      {/* ===== header banner ===== */}
      <div className="relative overflow-hidden bg-[#0A2850]">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="container-x relative py-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-2xl font-extrabold text-white">
              {patient?.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-brand-100/60 text-xs uppercase tracking-wider font-semibold mb-1">
                My account
              </p>
              <h1 className="text-2xl font-extrabold text-white truncate">
                {patient?.name || "Patient"}
              </h1>
              <p className="text-brand-100/70 text-sm flex items-center gap-1.5 mt-0.5">
                <FiPhone size={13} /> +91 {patient?.mobile}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatChip
              icon={FiCalendar}
              value={stats.upcoming}
              label="Upcoming"
            />
            <StatChip
              icon={FiCheckCircle}
              value={stats.completed}
              label="Completed"
            />
            <StatChip
              icon={FiTrendingUp}
              value={`₹${stats.totalPaid}`}
              label="Total paid"
            />
          </div>
        </div>
      </div>

      <div className="container-x py-8">
        <div className="grid lg:grid-cols-[260px,1fr] gap-6 items-start">
          {/* ===== sidebar ===== */}
          <aside className="card p-3 lg:sticky lg:top-6">
            <nav className="space-y-1">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                      active
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                        : "text-slate-600 hover:bg-brand-50"
                    }`}
                  >
                    <t.icon
                      size={17}
                      className={active ? "text-white" : "text-brand-600"}
                    />
                    {t.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left text-red-500 hover:bg-red-50 transition-colors"
              >
                <FiLogOut size={17} /> Logout
              </button>
            </div>
          </aside>

          {/* ===== content ===== */}
          <div>
            {tab === "appointments" && (
              <TabShell
                title="My Appointments"
                sub="Everything you've booked with us, past and upcoming."
              >
                {appointments.length === 0 ? (
                  <EmptyState
                    icon={FiCalendar}
                    title="No appointments yet"
                    sub="Book your first visit in under a minute."
                    ctaLabel="Book an appointment"
                    ctaHref="/appointment"
                  />
                ) : (
                  <div className="space-y-3">
                    {appointments.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        a={a}
                        onCancel={cancelAppointment}
                      />
                    ))}
                  </div>
                )}
              </TabShell>
            )}

            {tab === "payments" && (
              <TabShell
                title="Payment History"
                sub="A record of every payment linked to your appointments."
              >
                {payments.length === 0 ? (
                  <EmptyState
                    icon={FiCreditCard}
                    title="No payments yet"
                    sub="Payments will show up here once you book a paid consultation."
                  />
                ) : (
                  <div className="card divide-y divide-slate-100 overflow-hidden">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                            <FiCreditCard size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {p.service_name || "Consultation"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {p.appointment_code} ·{" "}
                              {new Date(p.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-slate-900">
                            ₹{p.amount}
                          </p>
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabShell>
            )}

            {tab === "history" && (
              <TabShell
                title="Medical History"
                sub="Diagnosis and treatment notes from your visits."
              >
                {history.length === 0 ? (
                  <EmptyState
                    icon={FiClipboard}
                    title="No medical history recorded yet"
                    sub="Your doctor will add notes here after a visit."
                  />
                ) : (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div key={h.id} className="card p-5">
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <p className="font-bold text-slate-900">{h.title}</p>
                          <span className="shrink-0 text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <FiClock size={11} /> {h.visit_date}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1.5">
                          <span className="font-semibold text-slate-700">
                            Diagnosis —{" "}
                          </span>
                          {h.diagnosis || "—"}
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Notes —{" "}
                          </span>
                          {h.treatment_notes || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabShell>
            )}
            {tab === "prescriptions" && (
              <TabShell
                title="Prescriptions"
                sub="Medicines prescribed to you, by visit."
              >
                {prescriptions.length === 0 ? (
                  <EmptyState
                    icon={FiFileText}
                    title="No prescriptions yet"
                    sub="Prescriptions from your doctor will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((p) => {
                      const meds =
                        typeof p.medicines_json === "string"
                          ? JSON.parse(p.medicines_json || "[]")
                          : p.medicines_json || [];

                      const attachments =
                        typeof p.attachment_urls === "string"
                          ? JSON.parse(p.attachment_urls || "[]")
                          : p.attachment_urls || [];

                      // Combine pdf_url + attachment_urls
                      const files = [
                        ...(p.pdf_url ? [p.pdf_url] : []),
                        ...(Array.isArray(attachments) ? attachments : []),
                      ].filter(Boolean);

                      const hasMedicines =
                        Array.isArray(meds) && meds.length > 0;
                      const hasNotes = Boolean(p.notes?.trim());

                      return (
                        <div key={p.id} className="card p-5">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-3 mb-3.5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 font-bold text-sm">
                                {p.doctor_name?.[0] || "D"}
                              </span>

                              <p className="font-bold text-slate-900">
                                {p.doctor_name?.startsWith("Dr.")
                                  ? p.doctor_name
                                  : `Dr. ${p.doctor_name}`}
                              </p>
                            </div>

                            <span className="text-xs font-semibold text-slate-400">
                              {p.prescribed_date}
                            </span>
                          </div>

                          {/* Medicines */}
                          {hasMedicines && (
                            <div className="flex flex-wrap gap-2">
                              {meds.map((m, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5"
                                >
                                  <FiActivity
                                    size={11}
                                    className="text-brand-600"
                                  />

                                  {m.name}

                                  <span className="text-slate-400">
                                    · {m.dosage} · {m.duration}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          {hasNotes && (
                            <div className="mt-3 text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">
                                Notes:
                              </span>{" "}
                              {p.notes}
                            </div>
                          )}

                          {/* Prescription files */}
                          {files.length > 0 && (
                            <div
                              className={`${
                                hasMedicines || hasNotes
                                  ? "mt-4 pt-4 border-t border-slate-100"
                                  : ""
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-500 mb-2">
                                Prescription / Attachments
                              </p>

                              <div className="flex flex-wrap gap-3">
                                {files.map((url, index) => {
                                  const isImage =
                                    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(
                                      url,
                                    );

                                  const isPdf = /\.pdf(\?.*)?$/i.test(url);

                                  return (
                                    <a
                                      key={`${url}-${index}`}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block group"
                                    >
                                      {isImage ? (
                                        <img
                                          src={url}
                                          alt={`Prescription ${index + 1}`}
                                          className="w-32 h-32 object-cover rounded-xl border border-slate-200 group-hover:opacity-80 transition"
                                        />
                                      ) : (
                                        <div className="w-32 h-32 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 group-hover:bg-slate-100 transition">
                                          <FiFileText
                                            size={28}
                                            className="text-brand-600"
                                          />

                                          <span className="text-xs font-semibold text-slate-600">
                                            {isPdf ? "View PDF" : "View File"}
                                          </span>
                                        </div>
                                      )}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Nothing except doctor/date */}
                          {!hasMedicines && !hasNotes && files.length === 0 && (
                            <p className="text-sm text-slate-400">
                              No prescription details available.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabShell>
            )}
            {tab === "family" && <FamilyMembersPanel />}

            {tab === "profile" && patient && (
              <ProfileForm patient={patient} onUpdated={setPatient} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatChip({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
        <Icon size={14} />
      </span>
      <div>
        <p className="text-base font-extrabold text-white leading-none">
          {value}
        </p>
        <p className="text-[10.5px] text-brand-100/60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TabShell({ title, sub, children }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, ctaLabel, ctaHref }) {
  return (
    <div className="card flex flex-col items-center text-center gap-3 px-6 py-14">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon size={24} />
      </span>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{sub}</p>
      </div>
      {ctaHref && (
        <Link href={ctaHref} className="btn-primary mt-2">
          <FiPlus size={15} /> {ctaLabel}
        </Link>
      )}
    </div>
  );
}

const STATUS_BAR = {
  pending: "bg-amber-400",
  confirmed: "bg-brand-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
  no_show: "bg-slate-300",
};

function AppointmentCard({ a, onCancel }) {
  const isUpcoming = ["pending", "confirmed"].includes(a.status);
  return (
    <div className="card overflow-hidden flex">
      <span
        className={`w-1.5 shrink-0 ${STATUS_BAR[a.status] || "bg-slate-300"}`}
      />
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="font-bold text-slate-900">
            Consultation with Dr. {a.doctor_name}
          </p>
          {a.patient_name && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              <FiUser size={11} /> For {a.patient_name}
              {a.patient_parent_id ? ` (${relationLabel(a.patient_relation)})` : " (Myself)"}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiCalendar size={13} className="text-brand-500" />{" "}
              {prettyDate(a.appointment_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock size={13} className="text-brand-500" />{" "}
              {to12h(a.start_time)}
            </span>
            {a.clinic_name && (
              <span className="flex items-center gap-1.5">
                <FiMapPin size={13} className="text-brand-500" />{" "}
                {a.clinic_name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Booking ID: {a.appointment_code}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!!a.final_amount && (
            <span className="text-sm font-bold text-slate-700">
              ₹{a.final_amount}
            </span>
          )}
          <StatusBadge status={a.status} />
          {isUpcoming && (
            <button
              onClick={() => onCancel(a.id)}
              className="flex items-center gap-1 text-red-500 text-sm font-semibold hover:text-red-600"
            >
              <FiX size={14} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-brand-100 text-brand-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-slate-200 text-slate-600",
    paid: "bg-green-100 text-green-700",
    created: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full capitalize whitespace-nowrap ${map[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

function ProfileForm({ patient, onUpdated }) {
  const [form, setForm] = useState({
    name: patient.name || "",
    father_husband_name: patient.father_husband_name || "",
    email: patient.email || "",
    gender: patient.gender || "",
    dob: patient.dob ? patient.dob.split("T")[0] : "",
    nationality: patient.nationality || "",
    marital_status: patient.marital_status || "",

    address: patient.address || "",

    permanent_address: patient.permanent_address || "",
    permanent_pincode: patient.permanent_pincode || "",

    local_address: patient.local_address || "",
    local_pincode: patient.local_pincode || "",

    referred_by: patient.referred_by || "",
    referrer_name: patient.referrer_name || "",
    referrer_address: patient.referrer_address || "",

    consent_date: patient.consent_date
      ? patient.consent_date.split("T")[0]
      : "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await apiClient.put("/patients/profile", form);

      onUpdated(res.data.patient);
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabShell
      title="My Profile"
      sub="Keep your details up to date so the clinic can reach you."
    >
      <div className="grid md:grid-cols-[1fr,300px] gap-5">
        <div className="card p-6">
          {saved && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm font-medium mb-5">
              <FiCheckCircle size={16} />
              Profile updated successfully!
            </div>
          )}

          {/* Personal Details */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Personal details
          </p>

          <div className="space-y-4 mb-6">
            <Field label="Full Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="input-field"
              />
            </Field>

            <Field label="Father's / Husband's Name">
              <input
                type="text"
                value={form.father_husband_name}
                onChange={(e) =>
                  handleChange("father_husband_name", e.target.value)
                }
                className="input-field"
                placeholder="Enter father's / husband's name"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="input-field"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Date of Birth">
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nationality">
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) =>
                    handleChange("nationality", e.target.value)
                  }
                  className="input-field"
                  placeholder="Indian"
                />
              </Field>

              <Field label="Marital Status">
                <select
                  value={form.marital_status}
                  onChange={(e) =>
                    handleChange("marital_status", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Select</option>
                  <option value="married">Married</option>
                  <option value="unmarried">Unmarried</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Contact */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Contact
          </p>

          <div className="space-y-4 mb-6">
            <Field label="Mobile Number">
              <div className="relative">
                <FiPhone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                  size={15}
                />

                <input
                  type="text"
                  value={`+91 ${patient.mobile}`}
                  disabled
                  className="input-field pl-10 bg-slate-50 text-slate-400"
                />
              </div>
            </Field>

            <Field label="Email">
              <div className="relative">
                <FiMail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                  size={15}
                />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </Field>
          </div>

          {/* Address */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Address details
          </p>

          <div className="space-y-4 mb-6">
            <Field label="Permanent Address">
              <textarea
                value={form.permanent_address}
                onChange={(e) =>
                  handleChange("permanent_address", e.target.value)
                }
                rows={3}
                className="input-field resize-none"
                placeholder="Enter permanent address"
              />
            </Field>

            <Field label="Permanent Pin Code">
              <input
                type="text"
                maxLength={10}
                value={form.permanent_pincode}
                onChange={(e) =>
                  handleChange("permanent_pincode", e.target.value)
                }
                className="input-field"
                placeholder="110001"
              />
            </Field>

            <Field label="Local Address">
              <textarea
                value={form.local_address}
                onChange={(e) =>
                  handleChange("local_address", e.target.value)
                }
                rows={3}
                className="input-field resize-none"
                placeholder="Enter current/local address"
              />
            </Field>

            <Field label="Local Pin Code">
              <input
                type="text"
                maxLength={10}
                value={form.local_pincode}
                onChange={(e) =>
                  handleChange("local_pincode", e.target.value)
                }
                className="input-field"
                placeholder="110005"
              />
            </Field>
          </div>

          {/* Referral Details */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Referral details
          </p>

          <div className="space-y-4 mb-6">
            <Field label="Referred By">
              <select
                value={form.referred_by}
                onChange={(e) =>
                  handleChange("referred_by", e.target.value)
                }
                className="input-field"
              >
                <option value="">Select</option>
                <option value="doctor">Doctor</option>
                <option value="hospital">Hospital</option>
                <option value="organisation">Organisation</option>
                <option value="self">Self</option>
              </select>
            </Field>

            {form.referred_by &&
              form.referred_by !== "self" && (
                <>
                  <Field label="Referrer Name">
                    <input
                      type="text"
                      value={form.referrer_name}
                      onChange={(e) =>
                        handleChange("referrer_name", e.target.value)
                      }
                      className="input-field"
                      placeholder="Doctor / Hospital / Organisation name"
                    />
                  </Field>

                  <Field label="Referrer Address">
                    <textarea
                      value={form.referrer_address}
                      onChange={(e) =>
                        handleChange("referrer_address", e.target.value)
                      }
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Enter referrer address"
                    />
                  </Field>
                </>
              )}
          </div>

          {/* Consent */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Consent details
          </p>

          <div className="space-y-4">
            <Field label="Consent Date">
              <input
                type="date"
                value={form.consent_date}
                onChange={(e) =>
                  handleChange("consent_date", e.target.value)
                }
                className="input-field"
              />
            </Field>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="btn-primary mt-6 w-full sm:w-auto"
          >
            <FiEdit3 size={15} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Profile Sidebar */}
        <div className="card p-6 h-fit bg-brand-50/50 border-brand-100">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-extrabold mb-4">
            {form.name?.[0]?.toUpperCase() || "P"}
          </div>

          <p className="font-bold text-slate-900">
            {form.name || "Your name"}
          </p>

          <p className="text-sm text-slate-500 mt-0.5">
            +91 {patient.mobile}
          </p>

          {form.gender && (
            <p className="text-xs text-slate-500 mt-2 capitalize">
              {form.gender}
            </p>
          )}

          {form.nationality && (
            <p className="text-xs text-slate-500 mt-1">
              {form.nationality}
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-brand-100 space-y-2 text-xs text-slate-500">
            <p>
              Your mobile number is verified and can&apos;t be changed here.
            </p>

            <p>
              Need to update it? Call the clinic and our team will help.
            </p>
          </div>
        </div>
      </div>
    </TabShell>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
