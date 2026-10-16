import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import FamilyCard from '../components/FamilyCard';


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

  return age;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [prescModal, setPrescModal] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [historyForm, setHistoryForm] = useState({ title: '', diagnosis: '', treatment_notes: '', visit_date: '', doctor_id: '' });
  const [prescForm, setPrescForm] = useState({ doctor_id: '', prescribed_date: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });

  const load = async () => {
    const res = await client.get(`/patients/${id}`);
    setData(res.data);
  };
  useEffect(() => { load(); client.get('/doctors').then((r) => setDoctors(r.data.doctors)); }, [id]);

  const saveHistory = async () => {
    try {
      await client.post('/medical-history', { ...historyForm, patient_id: id });
      toast.success('Medical history added');
      setHistoryModal(false);
      setHistoryForm({ title: '', diagnosis: '', treatment_notes: '', visit_date: '', doctor_id: '' });
      load();
    } catch (e) { toast.error('Failed to save'); }
  };

  const savePrescription = async () => {
    try {
      await client.post('/prescriptions', {
        patient_id: id,
        doctor_id: prescForm.doctor_id,
        prescribed_date: prescForm.prescribed_date,
        notes: prescForm.notes,
        medicines_json: prescForm.medicines
      });
      toast.success('Prescription added');
      setPrescModal(false);
      setPrescForm({ doctor_id: '', prescribed_date: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
      load();
    } catch (e) { toast.error('Failed to save'); }
  };

  const updateMedRow = (i, key, val) => {
    const meds = [...prescForm.medicines];
    meds[i] = { ...meds[i], [key]: val };
    setPrescForm({ ...prescForm, medicines: meds });
  };
  const addMedRow = () => setPrescForm({ ...prescForm, medicines: [...prescForm.medicines, { name: '', dosage: '', duration: '', instructions: '' }] });
  const removeMedRow = (i) => setPrescForm({ ...prescForm, medicines: prescForm.medicines.filter((_, idx) => idx !== i) });

  if (!data) return <AdminLayout title="Patient"><p className="text-slate-400">Loading...</p></AdminLayout>;
  const { patient, appointments, history, prescriptions } = data;

  return (
    <AdminLayout title={`Patient — ${patient.name || patient.mobile}`}>
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-brand-700 mb-6"><FiArrowLeft /> Back to Patients</Link>

      <FamilyCard client={client} patientId={patient.id} family={data.family || []} onChanged={load} />

{/* Patient Basic Information */}
<div className="card p-5 mb-6">
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="font-bold text-slate-900">
        Patient Information
      </h3>

      <p className="text-xs text-slate-400 mt-1">
        Complete personal and contact details
      </p>
    </div>

    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        patient.is_active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {patient.is_active ? "Active" : "Inactive"}
    </span>
  </div>

  {/* Basic Details */}
  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
    Basic Details
  </p>

  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">


    <InfoItem
      label="Full Name"
      value={patient.name}
    />

    <InfoItem
      label="Father's / Husband's Name"
      value={patient.father_husband_name}
    />

    <InfoItem
      label="Mobile"
      value={
        patient.mobile
          ? `+91 ${patient.mobile}`
          : "—"
      }
    />

    <InfoItem
      label="Email"
      value={patient.email}
    />

    <InfoItem
      label="Gender"
      value={
        patient.gender
          ? patient.gender.charAt(0).toUpperCase() +
            patient.gender.slice(1)
          : "—"
      }
    />

    <InfoItem
      label="Date of Birth"
      value={formatDate(patient.dob)}
    />

    <InfoItem
      label="Age"
      value={
        patient.dob
          ? `${calculateAge(patient.dob)} Years`
          : "—"
      }
    />

    <InfoItem
      label="Nationality"
      value={patient.nationality}
    />

    <InfoItem
      label="Marital Status"
      value={
        patient.marital_status
          ? patient.marital_status.charAt(0).toUpperCase() +
            patient.marital_status.slice(1)
          : "—"
      }
    />

    <InfoItem
      label="Consent Date"
      value={formatDate(patient.created_at)}
    />

    <InfoItem
      label="Status"
      value={patient.is_active ? "Active" : "Inactive"}
    />
  </div>

  {/* Address Details */}
  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
    Address Details
  </p>

  <div className="grid md:grid-cols-2 gap-4 mb-6">
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400 uppercase mb-1">
        Permanent Address
      </p>

      <p className="text-sm font-medium text-slate-700 whitespace-pre-line">
        {patient.permanent_address || "—"}
      </p>

      <p className="text-xs text-slate-500 mt-2">
        Pin Code: {patient.permanent_pincode || "—"}
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400 uppercase mb-1">
        Local Address
      </p>

      <p className="text-sm font-medium text-slate-700 whitespace-pre-line">
        {patient.local_address || "—"}
      </p>

      <p className="text-xs text-slate-500 mt-2">
        Pin Code: {patient.local_pincode || "—"}
      </p>
    </div>

    {patient.address && (
      <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
        <p className="text-xs text-slate-400 uppercase mb-1">
          Old / Legacy Address
        </p>

        <p className="text-sm font-medium text-slate-700 whitespace-pre-line">
          {patient.address}
        </p>
      </div>
    )}
  </div>

  {/* Referral Details */}
  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
    Referral Details
  </p>

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <InfoItem
      label="Referred By"
      value={
        patient.referred_by
          ? patient.referred_by.charAt(0).toUpperCase() +
            patient.referred_by.slice(1)
          : "—"
      }
    />

    <InfoItem
      label="Referrer Name"
      value={
        patient.referred_by === "self"
          ? "Self"
          : patient.referrer_name
      }
    />

    <InfoItem
      label="Referrer Address"
      value={
        patient.referred_by === "self"
          ? "—"
          : patient.referrer_address
      }
    />
  </div>

  {/* System Details */}
  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
    Record Details
  </p>

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

    <InfoItem
      label="Created At"
      value={formatDate(patient.created_at)}
    />

    <InfoItem
      label="Last Updated"
      value={formatDate(patient.updated_at)}
    />
  </div>
</div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Appointments</h3>
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2 flex justify-between">
                <span>{a.service_name} — {a.doctor_name}</span>
                <span className="text-slate-400">{a.appointment_date}</span>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-sm text-slate-400">No appointments yet.</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Medical History</h3>
            <button onClick={() => setHistoryModal(true)} className="btn-outline !px-2 !py-1"><FiPlus /></button>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
                <p className="font-medium">{h.title} <span className="text-slate-400 font-normal">— {h.visit_date}</span></p>
                <p className="text-slate-500 text-xs mt-1">{h.diagnosis}</p>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-slate-400">No history recorded.</p>}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Prescriptions</h3>
            <button onClick={() => setPrescModal(true)} className="btn-outline !px-2 !py-1"><FiPlus /></button>
          </div>
          <div className="space-y-3">
            {prescriptions.map((p) => {
              const meds = typeof p.medicines_json === 'string' ? JSON.parse(p.medicines_json) : p.medicines_json;
              return (
                <div key={p.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <p className="font-medium mb-1">{p.prescribed_date}</p>
                  <ul className="text-slate-500 text-xs list-disc pl-4">
                    {(meds || []).map((m, i) => <li key={i}>{m.name} — {m.dosage} ({m.duration})</li>)}
                  </ul>
                </div>
              );
            })}
            {prescriptions.length === 0 && <p className="text-sm text-slate-400">No prescriptions yet.</p>}
          </div>
        </div>
      </div>

      <Modal open={historyModal} onClose={() => setHistoryModal(false)} title="Add Medical History">
        <div className="space-y-3">
          <div><label className="label">Title</label><input className="input" value={historyForm.title} onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })} /></div>
          <div><label className="label">Doctor</label>
            <select className="input" value={historyForm.doctor_id} onChange={(e) => setHistoryForm({ ...historyForm, doctor_id: e.target.value })}>
              <option value="">-- select --</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label">Visit Date</label><input type="date" className="input" value={historyForm.visit_date} onChange={(e) => setHistoryForm({ ...historyForm, visit_date: e.target.value })} /></div>
          <div><label className="label">Diagnosis</label><textarea className="input" rows={2} value={historyForm.diagnosis} onChange={(e) => setHistoryForm({ ...historyForm, diagnosis: e.target.value })} /></div>
          <div><label className="label">Treatment Notes</label><textarea className="input" rows={2} value={historyForm.treatment_notes} onChange={(e) => setHistoryForm({ ...historyForm, treatment_notes: e.target.value })} /></div>
        </div>
        <button onClick={saveHistory} className="btn-primary w-full mt-5 justify-center">Save</button>
      </Modal>

      <Modal open={prescModal} onClose={() => setPrescModal(false)} title="Add Prescription" wide>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div><label className="label">Doctor</label>
            <select className="input" value={prescForm.doctor_id} onChange={(e) => setPrescForm({ ...prescForm, doctor_id: e.target.value })}>
              <option value="">-- select --</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label">Date</label><input type="date" className="input" value={prescForm.prescribed_date} onChange={(e) => setPrescForm({ ...prescForm, prescribed_date: e.target.value })} /></div>
        </div>
        <label className="label">Medicines</label>
        <div className="space-y-2 mb-3">
          {prescForm.medicines.map((m, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input placeholder="Name" className="input" value={m.name} onChange={(e) => updateMedRow(i, 'name', e.target.value)} />
              <input placeholder="Dosage" className="input" value={m.dosage} onChange={(e) => updateMedRow(i, 'dosage', e.target.value)} />
              <input placeholder="Duration" className="input" value={m.duration} onChange={(e) => updateMedRow(i, 'duration', e.target.value)} />
              <div className="flex gap-1">
                <input placeholder="Instructions" className="input" value={m.instructions} onChange={(e) => updateMedRow(i, 'instructions', e.target.value)} />
                <button onClick={() => removeMedRow(i)} className="text-red-500 shrink-0"><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addMedRow} className="btn-outline mb-4">+ Add Medicine</button>
        <div><label className="label">Notes</label><textarea className="input" rows={2} value={prescForm.notes} onChange={(e) => setPrescForm({ ...prescForm, notes: e.target.value })} /></div>
        <button onClick={savePrescription} className="btn-primary w-full mt-5 justify-center">Save Prescription</button>
      </Modal>
    </AdminLayout>
  );
}
function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400 uppercase mb-1">
        {label}
      </p>

      <p className="text-sm font-medium text-slate-700 break-words">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "—"}
      </p>
    </div>
  );
}