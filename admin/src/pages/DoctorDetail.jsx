import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTrash2, FiArrowLeft } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';

const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];

// "10:00-14:00,17:00-21:00" <-> [["10:00","14:00"],["17:00","21:00"]]
const windowsToText = (windows = []) => windows.map(([s, e]) => `${s}-${e}`).join(', ');
const textToWindows = (text) =>
  text.split(',').map((s) => s.trim()).filter(Boolean).map((pair) => {
    const [s, e] = pair.split('-').map((t) => t.trim());
    return [s, e];
  }).filter(([s, e]) => s && e);

export default function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [clinicRows, setClinicRows] = useState([]);
  const [serviceRows, setServiceRows] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [slotBlocks, setSlotBlocks] = useState([]);
  const [availText, setAvailText] = useState({});
  const [selectedClinic, setSelectedClinic] = useState('');
  const [feeForm, setFeeForm] = useState({ service_id: '', duration_minutes: '' });
  const [leaveForm, setLeaveForm] = useState({ leave_date: '', reason: '' });
  const [blockForm, setBlockForm] = useState({ clinic_id: '', block_date: '', start_time: '', reason: '' });

  const load = async () => {
    const [detailRes, clinicsRes, servicesRes, leavesRes, blocksRes] = await Promise.all([
      client.get(`/doctors/${id}`),
      client.get('/clinics'),
      client.get('/services'),
      client.get(`/doctors/${id}/leaves`),
      client.get(`/doctors/${id}/slot-blocks`)
    ]);
    setDoctor(detailRes.data.doctor);
    setClinicRows(detailRes.data.clinics);
    setServiceRows(detailRes.data.services);
    setAllClinics(clinicsRes.data.clinics);
    setAllServices(servicesRes.data.services);
    setLeaves(leavesRes.data.leaves);
    setSlotBlocks(blocksRes.data.blocks);
  };
  useEffect(() => { load(); }, [id]);

  const openAvailEditor = (clinicId) => {
    setSelectedClinic(clinicId);
    const existing = clinicRows.find((c) => c.clinic_id === parseInt(clinicId, 10));
    const weekly = existing ? (typeof existing.weekly_availability === 'string' ? JSON.parse(existing.weekly_availability) : existing.weekly_availability) : {};
    const text = {};
    DAYS.forEach(([key]) => { text[key] = windowsToText(weekly?.[key] || []); });
    setAvailText(text);
  };

  const saveAvailability = async () => {
    const weekly = {};
    DAYS.forEach(([key]) => { weekly[key] = textToWindows(availText[key] || ''); });
    try {
      await client.post(`/doctors/${id}/clinics`, { clinic_id: selectedClinic, weekly_availability: weekly });
      toast.success('Availability saved');
      load();
    } catch (e) {
      toast.error('Failed to save availability');
    }
  };

  const saveService = async () => {
    if (!feeForm.service_id) return toast.error('Select a service');
    try {
      await client.post(`/doctors/${id}/services`, { ...feeForm, fee: 0 });
      toast.success('Service mapped');
      setFeeForm({ service_id: '', duration_minutes: '' });
      load();
    } catch (e) {
      toast.error('Failed to save service');
    }
  };

  const addLeave = async () => {
    if (!leaveForm.leave_date) return;
    try {
      await client.post(`/doctors/${id}/leaves`, leaveForm);
      toast.success('Leave added');
      setLeaveForm({ leave_date: '', reason: '' });
      load();
    } catch (e) {
      toast.error('Failed to add leave');
    }
  };

  const removeLeave = async (leaveId) => {
    await client.delete(`/doctors/${id}/leaves/${leaveId}`);
    load();
  };

  const addSlotBlock = async () => {
    if (!blockForm.block_date || !blockForm.start_time) {
      return toast.error('Date and time are required');
    }
    try {
      await client.post(`/doctors/${id}/slot-blocks`, { ...blockForm, clinic_id: blockForm.clinic_id || null });
      toast.success('Slot blocked');
      setBlockForm({ clinic_id: '', block_date: '', start_time: '', reason: '' });
      load();
    } catch (e) {
      toast.error('Failed to block slot');
    }
  };

  const removeSlotBlock = async (blockId) => {
    await client.delete(`/doctors/${id}/slot-blocks/${blockId}`);
    load();
  };

  if (!doctor) return <AdminLayout title="Doctor"><p className="text-slate-400">Loading...</p></AdminLayout>;

  return (
    <AdminLayout title={`Manage — ${doctor.name}`}>
      <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-brand-700 mb-6"><FiArrowLeft /> Back to Doctors</Link>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clinic Availability */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-1">Clinic Availability</h3>
          <p className="text-xs text-slate-500 mb-4">Set weekly time windows per clinic, e.g. "10:00-14:00, 17:00-21:00"</p>

          <label className="label">Select Clinic</label>
          <select className="input mb-4" value={selectedClinic} onChange={(e) => openAvailEditor(e.target.value)}>
            <option value="">-- choose clinic --</option>
            {allClinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {selectedClinic && (
            <div className="space-y-2 mb-4">
              {DAYS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[80px,1fr] items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                  <input
                    type="text"
                    placeholder="e.g. 10:00-14:00, 17:00-21:00"
                    className="input !py-1.5 text-xs"
                    value={availText[key] || ''}
                    onChange={(e) => setAvailText({ ...availText, [key]: e.target.value })}
                  />
                </div>
              ))}
              <button onClick={saveAvailability} className="btn-primary w-full justify-center mt-2">Save Availability</button>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Currently Mapped Clinics</p>
            {clinicRows.map((c) => (
              <div key={c.id} className="text-sm text-slate-600 py-1">{allClinics.find((ac) => ac.id === c.clinic_id)?.name || `Clinic #${c.clinic_id}`}</div>
            ))}
            {clinicRows.length === 0 && <p className="text-sm text-slate-400">No clinics mapped yet.</p>}
          </div>
        </div>

        {/* Services Offered */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-1">Services Offered</h3>
          <p className="text-xs text-slate-500 mb-4">
            Consultation fee is set on the doctor's profile (Edit Doctor) and applies to every booking —
            current fee: <span className="font-semibold text-brand-700">₹{doctor.consultation_fee || 0}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <select className="input col-span-3" value={feeForm.service_id} onChange={(e) => setFeeForm({ ...feeForm, service_id: e.target.value })}>
              <option value="">-- select service --</option>
              {allServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" placeholder="Duration override (min, optional)" className="input col-span-3" value={feeForm.duration_minutes} onChange={(e) => setFeeForm({ ...feeForm, duration_minutes: e.target.value })} />
          </div>
          <button onClick={saveService} className="btn-primary w-full justify-center mb-4">Save Service</button>

          <div className="space-y-2">
            {serviceRows.map((s) => (
              <div key={s.id} className="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span>{allServices.find((as) => as.id === s.service_id)?.name || `Service #${s.service_id}`}</span>
                {s.duration_minutes ? <span className="text-slate-500">{s.duration_minutes} min</span> : null}
              </div>
            ))}
            {serviceRows.length === 0 && <p className="text-sm text-slate-400">No services mapped yet.</p>}
          </div>
        </div>

        {/* Leaves */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4">Leaves</h3>
          <div className="flex gap-2 mb-4">
            <input type="date" className="input" value={leaveForm.leave_date} onChange={(e) => setLeaveForm({ ...leaveForm, leave_date: e.target.value })} />
            <input type="text" placeholder="Reason (optional)" className="input" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            <button onClick={addLeave} className="btn-primary shrink-0">Add Leave</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {leaves.map((l) => (
              <div key={l.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span>{l.leave_date} {l.reason && `— ${l.reason}`}</span>
                <button onClick={() => removeLeave(l.id)} className="text-red-500"><FiTrash2 /></button>
              </div>
            ))}
            {leaves.length === 0 && <p className="text-sm text-slate-400">No leaves scheduled.</p>}
          </div>
        </div>

        {/* Blocked Time Slots */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-1">Blocked Time Slots</h3>
          <p className="text-xs text-slate-500 mb-4">Block a single time (e.g. just 11:30) on a date — that slot won't show up as bookable to patients. Leave clinic blank to block at all clinics.</p>
          <div className="grid sm:grid-cols-4 gap-2 mb-4">
            <select className="input" value={blockForm.clinic_id} onChange={(e) => setBlockForm({ ...blockForm, clinic_id: e.target.value })}>
              <option value="">All clinics</option>
              {allClinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className="input" value={blockForm.block_date} onChange={(e) => setBlockForm({ ...blockForm, block_date: e.target.value })} />
            <input type="time" className="input" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} />
            <input type="text" placeholder="Reason (optional)" className="input" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
          </div>
          <button onClick={addSlotBlock} className="btn-primary w-full justify-center mb-4">Block Slot</button>
          <div className="grid sm:grid-cols-2 gap-2">
            {slotBlocks.map((b) => (
              <div key={b.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span>
                  {b.block_date}, {String(b.start_time).slice(0, 5)}–{String(b.end_time).slice(0, 5)}
                  {b.clinic_id ? ` — ${allClinics.find((c) => c.id === b.clinic_id)?.name || `Clinic #${b.clinic_id}`}` : ' — all clinics'}
                  {b.reason && ` (${b.reason})`}
                </span>
                <button onClick={() => removeSlotBlock(b.id)} className="text-red-500"><FiTrash2 /></button>
              </div>
            ))}
            {slotBlocks.length === 0 && <p className="text-sm text-slate-400">No time slots blocked.</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}