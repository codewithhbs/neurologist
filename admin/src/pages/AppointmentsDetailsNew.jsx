// src/pages/AppointmentsDetails.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiEdit2,
  FiSave,
  FiXCircle,
  FiUpload,
  FiTrash2,
  FiPaperclip,
  FiLoader,
  FiTag,
  FiActivity,
  FiInfo,
  FiPlus,
} from "react-icons/fi";
import client from "../api/client";
import AdminLayout from "../components/AdminLayout";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-200 text-slate-600",
};

const STATUS_INFO = {
  pending: "Booked but not yet confirmed (e.g. payment/collection pending)",
  confirmed: "Confirmed — patient is expected to visit",
  completed: "Patient visited and consultation is done",
  cancelled: "Appointment was cancelled, slot freed up",
  no_show: "Patient did not show up for the appointment",
};

const PAYMENT_COLORS = {
  not_required: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const PAYMENT_INFO = {
  not_required: "Free appointment — no payment needed",
  pending: "Payment not collected yet",
  paid: "Payment received",
  failed: "Payment attempt failed",
  refunded: "Payment was refunded to the patient",
};

function formatTime(t) {
  return t ? String(t).slice(0, 5) : "-";
}
function formatMoney(v) {
  return `₹${Number(v || 0).toFixed(2)}`;
}
function formatLabel(v) {
  if (!v) return "-";
  return String(v).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AppointmentsDetailsNew() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [services, setServices] = useState([]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSlots, setEditSlots] = useState([]);
  const [editSlotsLoading, setEditSlotsLoading] = useState(false);
  const [showStatusLegend, setShowStatusLegend] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/appointments/${id}`);
      setAppointment({
        ...res.data.appointment,
        payments: res.data.payments || [],
        prescriptions: res.data.prescriptions || [],
        history: res.data.history || [],
      });
    } catch (err) {
      toast.error("Failed to load appointment");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const [clinicRes, doctorRes, serviceRes] = await Promise.all([
          client.get("/clinics"),
          client.get("/doctors"),
          client.get("/services"),
        ]);
        setClinics(clinicRes.data?.clinics || []);
        setDoctors(doctorRes.data?.doctors || []);
        setServices(serviceRes.data?.services || []);
      } catch (e) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    const prev = appointment.status;
    setAppointment((a) => ({ ...a, status }));
    try {
      await client.put(`/appointments/${id}/status`, { status });
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
      setAppointment((a) => ({ ...a, status: prev }));
    }
  };

  const startEdit = () => {
    setEditForm({
      clinic_id: appointment.clinic_id,
      doctor_id: appointment.doctor_id,
      service_id: appointment.service_id || "",
      appointment_date: appointment.appointment_date?.slice(0, 10) || "",
      start_time: String(appointment.start_time || "").slice(0, 5),
      reason: appointment.reason || "",
      notes: appointment.notes || "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
    setEditSlots([]);
  };

  useEffect(() => {
    if (!editing || !editForm) return;
    const { clinic_id, doctor_id, appointment_date, service_id } = editForm;
    if (!clinic_id || !doctor_id || !appointment_date) {
      setEditSlots([]);
      return;
    }
    let cancelled = false;
    setEditSlotsLoading(true);
    client
      .get("/appointments/available-slots", {
        params: {
          clinic_id,
          doctor_id,
          date: appointment_date,
          service_id: service_id || undefined,
          exclude_appointment_id: id,
        },
      })
      .then((res) => {
        if (!cancelled) setEditSlots(res.data.slots || []);
      })
      .catch(() => {
        if (!cancelled) setEditSlots([]);
      })
      .finally(() => {
        if (!cancelled) setEditSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, editForm?.clinic_id, editForm?.doctor_id, editForm?.appointment_date, editForm?.service_id]);

  const updateEditForm = (field, value) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const saveEdit = async () => {
    if (!editForm.clinic_id || !editForm.doctor_id || !editForm.appointment_date || !editForm.start_time) {
      return toast.error("Clinic, doctor, date and time slot are required");
    }
    setSaving(true);
    try {
      const res = await client.put(`/appointments/${id}`, {
        clinic_id: editForm.clinic_id,
        doctor_id: editForm.doctor_id,
        service_id: editForm.service_id || null,
        appointment_date: editForm.appointment_date,
        start_time: editForm.start_time,
        reason: editForm.reason,
        notes: editForm.notes,
      });
      setAppointment((prev) => ({ ...prev, ...res.data.appointment }));
      toast.success("Appointment updated");
      setEditing(false);
      setEditForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update appointment");
    } finally {
      setSaving(false);
    }
  };

  const addPrescription = async (payload) => {
    const res = await client.post("/prescriptions", payload);
    setAppointment((prev) => ({
      ...prev,
      prescriptions: [{ id: res.data.id, ...payload }, ...(prev.prescriptions || [])],
    }));
    toast.success("Prescription added");
  };

  const deletePrescription = async (pid) => {
    await client.delete(`/prescriptions/${pid}`);
    setAppointment((prev) => ({
      ...prev,
      prescriptions: (prev.prescriptions || []).filter((p) => p.id !== pid),
    }));
    toast.success("Prescription removed");
  };

  const addHistory = async (payload) => {
    const res = await client.post("/medical-history", payload);
    setAppointment((prev) => ({
      ...prev,
      history: [{ id: res.data.id, ...payload }, ...(prev.history || [])],
    }));
    toast.success("Medical history added");
  };

  const deleteHistory = async (hid) => {
    await client.delete(`/medical-history/${hid}`);
    setAppointment((prev) => ({
      ...prev,
      history: (prev.history || []).filter((h) => h.id !== hid),
    }));
    toast.success("Medical history removed");
  };

  if (loading) {
    return (
      <AdminLayout title="Appointment">
        <div className="py-20 text-center text-slate-400">Loading…</div>
      </AdminLayout>
    );
  }

  if (!appointment) return null;

  const isFree = Number(appointment.is_free) === 1;
  const payAtClinic = appointment.payment_method === "pay_at_clinic";
  const isPaid = appointment.payment_status === "paid";
  const isLocked = ["completed", "cancelled"].includes(appointment.status);

  return (
    <AdminLayout title="Appointment Details">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700 transition"
      >
        <FiArrowLeft /> Back
      </button>

      <div className="space-y-5">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-6 text-white shadow-sm">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold shrink-0">
                {(appointment.patient_name || "?").trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold truncate">
                  {appointment.patient_name || "Unknown Patient"}
                </div>
                <div className="text-sm text-white/80 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <FiPhone size={12} /> {appointment.patient_mobile || "-"}
                  </span>
             
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar size={12} /> {formatDate(appointment.appointment_date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiClock size={12} /> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {appointment.appointment_code || `#${appointment.id}`} • Booked via{" "}
                  {formatLabel(appointment.booked_via)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={appointment.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className={`appearance-none cursor-pointer rounded-full pl-3 pr-8 py-1.5 text-xs font-bold border-0 focus:ring-2 focus:ring-white/50 ${STATUS_COLORS[appointment.status] || "bg-slate-100 text-slate-600"}`}
                  title={STATUS_INFO[appointment.status] || ""}
                >
                  {["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => (
                    <option key={s} value={s}>{formatLabel(s)}</option>
                  ))}
                </select>
              </div>
              <span
                className={`badge ${PAYMENT_COLORS[appointment.payment_status] || "bg-slate-100 text-slate-600"}`}
                title={PAYMENT_INFO[appointment.payment_status] || ""}
              >
                {formatLabel(appointment.payment_status)}
              </span>
              {!editing && !isLocked && (
                <button
                  onClick={startEdit}
                  className="!py-1.5 !px-3 text-sm inline-flex items-center gap-1.5 rounded-lg bg-white text-brand-700 font-semibold hover:bg-white/90 transition"
                >
                  <FiEdit2 /> Edit
                </button>
              )}
            </div>
          </div>
          <div className="absolute -right-10 -bottom-16 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-24 -top-20 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={() => setShowStatusLegend((v) => !v)}
          className="text-xs text-slate-400 hover:text-brand-600 inline-flex items-center gap-1 -mt-2"
        >
          <FiInfo size={12} /> {showStatusLegend ? "Hide" : "What do statuses mean?"}
        </button>
        {showStatusLegend && (
          <div className="grid sm:grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
            {Object.entries(STATUS_INFO).map(([key, desc]) => (
              <div key={key} className="flex items-start gap-2 text-xs text-slate-500">
                <span className={`badge ${STATUS_COLORS[key]} shrink-0`}>{formatLabel(key)}</span>
                <span className="mt-0.5">{desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* PATIENT / CLINIC / DOCTOR */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={<FiUser />} title="Patient">
            <Row label="Name" value={appointment.patient_name} />
            <Row label="Mobile" value={appointment.patient_mobile} icon={<FiPhone size={11} />} />
            <Row label="Patient ID" value={`PT-${appointment.patient_id}`} strong />
          </Card>

          <Card icon={<FiMapPin />} title="Clinic">
            {editing ? (
              <select className="input" value={editForm.clinic_id} onChange={(e) => updateEditForm("clinic_id", e.target.value)}>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <>
                <Row label="Clinic" value={appointment.clinic_name} />
                <Row label="Address" value={appointment.clinic_address} />
              </>
            )}
          </Card>

          <Card icon={<FiUser />} title="Doctor">
            {editing ? (
              <select className="input" value={editForm.doctor_id} onChange={(e) => updateEditForm("doctor_id", e.target.value)}>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <Row label="Doctor" value={appointment.doctor_name} />
            )}
          </Card>
        </div>

        {/* SCHEDULE */}
        <Card icon={<FiCalendar />} title="Schedule">
          {editing ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Service (optional)</label>
                <select className="input" value={editForm.service_id} onChange={(e) => updateEditForm("service_id", e.target.value)}>
                  <option value="">-- No specific service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={editForm.appointment_date} onChange={(e) => updateEditForm("appointment_date", e.target.value)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="label">
                  Time Slot {editSlotsLoading && <FiLoader className="inline animate-spin ml-1" />}
                </label>
                <select className="input" value={editForm.start_time} onChange={(e) => updateEditForm("start_time", e.target.value)}>
                  {!editSlots.includes(editForm.start_time) && editForm.start_time && (
                    <option value={editForm.start_time}>{formatTime(editForm.start_time)} (current)</option>
                  )}
                  {editSlots.map((slot) => (
                    <option key={slot} value={slot}>{formatTime(slot)}</option>
                  ))}
                  {editSlots.length === 0 && !editSlotsLoading && (
                    <option value="" disabled>No slots available</option>
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Row label="Service" value={appointment.service_name} />
              <Row label="Date" value={formatDate(appointment.appointment_date)} icon={<FiCalendar size={11} />} />
              <Row label="Time" value={`${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`} icon={<FiClock size={11} />} />
              <Row label="Receptionist ID" value={appointment.created_by_receptionist_id} />
            </div>
          )}
        </Card>

        {/* PAYMENT */}
        <Card icon={<FiCreditCard />} title="Payment">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Row label="Fee" value={formatMoney(appointment.fee_amount)} />
            <Row label="Discount" value={formatMoney(appointment.discount_amount)} />
            <Row label="Coupon ID" value={appointment.coupon_id} icon={<FiTag size={11} />} />
            <Row label="Final Amount" value={formatMoney(appointment.final_amount)} strong />
            <Row label="Method" value={formatLabel(appointment.payment_method)} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <span className="text-sm text-slate-500">Type:</span>
            <span className={`badge ${isFree || isPaid ? "bg-green-100 text-green-700" : payAtClinic ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
              {isFree ? "Free" : isPaid ? "Paid Online" : payAtClinic ? "Pay at Clinic" : "Paid"}
            </span>
          </div>
          {appointment.payments?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Payment Records</p>
              {appointment.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <span>{formatMoney(p.amount)} • {p.method || "-"}</span>
                  <span
                    className={`badge ${PAYMENT_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}
                    title={PAYMENT_INFO[p.status] || ""}
                  >
                    {formatLabel(p.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* NOTES */}
        <Card icon={<FiFileText />} title="Notes & Reason">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="label">Reason</label>
                <input type="text" className="input" value={editForm.reason} onChange={(e) => updateEditForm("reason", e.target.value)} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} value={editForm.notes} onChange={(e) => updateEditForm("notes", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <Row label="Reason" value={appointment.reason} />
              <Row label="Notes" value={appointment.notes} />
              <Row label="Cancelled Reason" value={appointment.cancelled_reason} />
            </div>
          )}
        </Card>

        {editing && (
          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit} disabled={saving} className="btn-outline inline-flex items-center gap-1.5">
              <FiXCircle /> Cancel
            </button>
            <button onClick={saveEdit} disabled={saving} className="btn-primary inline-flex items-center gap-1.5">
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* MEDICAL HISTORY (with upload) */}
        <MedicalHistorySection
          appointment={appointment}
          onAddHistory={addHistory}
          onDeleteHistory={deleteHistory}
        />

        {/* PRESCRIPTIONS (with upload) */}
        <PrescriptionsSection
          appointment={appointment}
          onAddPrescription={addPrescription}
          onDeletePrescription={deletePrescription}
        />
        <Card icon={<FiClock />} title="Record Info">
          <div className="grid sm:grid-cols-2 gap-4">
            <Row label="Created At" value={appointment.created_at} />
            <Row label="Updated At" value={appointment.updated_at} />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

/* ================= Medical History (with file upload) ================= */
function MedicalHistorySection({ appointment, onAddHistory, onDeleteHistory }) {
  const [title, setTitle] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const history = appointment.history || [];

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await client.post("/upload/medical-history", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments((prev) => [...prev, res.data.url]);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (url) => {
    setAttachments((prev) => prev.filter((a) => a !== url));
  };

  const submit = async () => {
    if (!title.trim() && !diagnosis.trim() && !treatmentNotes.trim() && attachments.length === 0) {
      return toast.error("Add at least a title, diagnosis, note or attachment");
    }
    setSubmitting(true);
    try {
      await onAddHistory({
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        title: title.trim() || null,
        diagnosis: diagnosis.trim() || null,
        treatment_notes: treatmentNotes.trim() || null,
        attachment_urls: attachments.length ? attachments : null,
        visit_date: appointment.appointment_date?.slice(0, 10),
      });
      setTitle("");
      setDiagnosis("");
      setTreatmentNotes("");
      setAttachments([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add medical history");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card icon={<FiActivity />} title="Medical History">
      <div className="space-y-2 mb-4">
        {history.length === 0 && (
          <p className="text-sm text-slate-400">No medical history recorded yet.</p>
        )}
        {history.map((h) => {
          const urls =
            typeof h.attachment_urls === "string"
              ? JSON.parse(h.attachment_urls || "[]")
              : h.attachment_urls || [];
          return (
            <div key={h.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2">
              <div className="min-w-0">
                {h.title && <p className="text-sm font-medium text-slate-700">{h.title}</p>}
                {h.diagnosis && <p className="text-xs text-slate-500 mt-1">Diagnosis: {h.diagnosis}</p>}
                {h.treatment_notes && (
                  <p className="text-xs text-slate-500 mt-1">Treatment: {h.treatment_notes}</p>
                )}
                {urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {urls.map((u, i) => (
                        <a
                        key={i}
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-700 inline-flex items-center gap-1"
                      >
                        <FiPaperclip size={11} /> Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">{formatDate(h.visit_date)}</p>
              </div>
              <button onClick={() => onDeleteHistory(h.id)} className="text-red-500 shrink-0">
                <FiTrash2 />
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <label className="label">Add Medical History</label>
        <input
          className="input"
          placeholder="Title (e.g. Root canal, Cleaning)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Treatment notes"
          value={treatmentNotes}
          onChange={(e) => setTreatmentNotes(e.target.value)}
        />

        <div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-outline shrink-0 !px-3 inline-flex items-center gap-1.5"
            >
              {uploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
              Upload File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFile}
            />
            <span className="text-xs text-slate-400">
              {attachments.length > 0
                ? `${attachments.length} file(s) attached`
                : "PDF or image (X-ray, report, etc.)"}
            </span>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((url, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1 text-xs"
                >
                  <FiPaperclip size={11} /> File {i + 1}
                  <button onClick={() => removeAttachment(url)} className="text-red-500">
                    <FiXCircle size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full justify-center inline-flex items-center gap-1.5"
        >
          <FiPlus /> {submitting ? "Saving..." : "Add Medical History"}
        </button>
      </div>
    </Card>
  );
}

/* ================= Prescriptions (with file upload) ================= */
function PrescriptionsSection({ appointment, onAddPrescription, onDeletePrescription }) {
  const [notes, setNotes] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const prescriptions = appointment.prescriptions || [];

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await client.post("/upload/prescriptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPdfUrl(res.data.url);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const submit = async () => {
    if (!pdfUrl && !notes.trim()) return toast.error("Add a note or upload a file first");
    setSubmitting(true);
    try {
      await onAddPrescription({
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        notes: notes.trim() || null,
        pdf_url: pdfUrl || null,
        prescribed_date: appointment.appointment_date?.slice(0, 10),
      });
      setNotes("");
      setPdfUrl("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card icon={<FiFileText />} title="Prescriptions">
      <div className="space-y-2 mb-4">
        {prescriptions.length === 0 && <p className="text-sm text-slate-400">No prescriptions added yet.</p>}
        {prescriptions.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2">
            <div className="min-w-0">
              {p.notes && <p className="text-sm text-slate-700">{p.notes}</p>}
              {p.pdf_url && (
                <a href={p.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-brand-700 inline-flex items-center gap-1 mt-1">
                  <FiPaperclip /> View attachment
                </a>
              )}
              {p.prescribed_date && <p className="text-xs text-slate-400 mt-1">{formatDate(p.prescribed_date)}</p>}
            </div>
            <button onClick={() => onDeletePrescription(p.id)} className="text-red-500 shrink-0">
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className="label">Add Prescription</label>
        <textarea className="input mb-2" rows={2} placeholder="Prescription notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-2 items-center mb-3">
          <input className="input flex-1" placeholder="Attachment URL, or upload below" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-outline shrink-0 !px-3">
            {uploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
          </button>
          <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
        </div>
        <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? "Saving..." : "Add Prescription"}
        </button>
      </div>
    </Card>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">{icon}</div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, strong = false, icon }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-sm break-words ${strong ? "font-bold text-slate-900" : "text-slate-700"}`}>
        {value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : "-"}
      </div>
    </div>
  );
}