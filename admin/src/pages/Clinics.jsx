import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = { name: '', address: '', city: '', state: '', pincode: '', phone: '', appointment_number: '', whatsapp_number: '', email: '', slot_duration_minutes: 30 };

export default function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [modal, setModal] = useState(false);
  const [holidayModal, setHolidayModal] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [newHoliday, setNewHoliday] = useState({ holiday_date: '', reason: '' });

  const load = () => client.get('/clinics').then((res) => setClinics(res.data.clinics));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditId(c.id); setModal(true); };

  const save = async () => {
    try {
      if (editId) await client.put(`/clinics/${editId}`, form);
      else await client.post('/clinics', form);
      toast.success('Clinic saved');
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this clinic?')) return;
    await client.delete(`/clinics/${id}`);
    toast.success('Clinic deactivated');
    load();
  };

  const openHolidays = async (clinic) => {
    setHolidayModal(clinic);
    const res = await client.get(`/clinics/${clinic.id}/holidays`);
    setHolidays(res.data.holidays);
  };

  const addHoliday = async () => {
    if (!newHoliday.holiday_date) return;
    try {
      await client.post(`/clinics/${holidayModal.id}/holidays`, newHoliday);
      const res = await client.get(`/clinics/${holidayModal.id}/holidays`);
      setHolidays(res.data.holidays);
      setNewHoliday({ holiday_date: '', reason: '' });
    } catch (e) {
      toast.error('Failed to add holiday (maybe duplicate)');
    }
  };

  const removeHoliday = async (holidayId) => {
    await client.delete(`/clinics/${holidayModal.id}/holidays/${holidayId}`);
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
  };

  return (
    <AdminLayout title="Clinics">
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="btn-primary"><FiPlus /> Add Clinic</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'city', label: 'City' },
          { key: 'phone', label: 'Phone' },
          { key: 'slot_duration_minutes', label: 'Slot (min)' }
        ]}
        rows={clinics}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openHolidays(row)} className="btn-outline !px-2 !py-1"><FiCalendar /></button>
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Clinic' : 'Add Clinic'} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Clinic Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">City</label><input className="input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><input className="input" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">Pincode</label><input className="input" value={form.pincode || ''} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
          <div><label className="label">Slot Duration (min)</label><input type="number" className="input" value={form.slot_duration_minutes} onChange={(e) => setForm({ ...form, slot_duration_minutes: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Appointment Number</label><input className="input" value={form.appointment_number || ''} onChange={(e) => setForm({ ...form, appointment_number: e.target.value })} /></div>
          <div><label className="label">WhatsApp Number</label><input className="input" value={form.whatsapp_number || ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Clinic</button>
      </Modal>

      <Modal open={!!holidayModal} onClose={() => setHolidayModal(null)} title={`Holidays — ${holidayModal?.name || ''}`}>
        <div className="flex gap-2 mb-5">
          <input type="date" className="input" value={newHoliday.holiday_date} onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })} />
          <input type="text" placeholder="Reason" className="input" value={newHoliday.reason} onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })} />
          <button onClick={addHoliday} className="btn-primary shrink-0">Add</button>
        </div>
        <div className="space-y-2">
          {holidays.map((h) => (
            <div key={h.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-2">
              <span>{h.holiday_date} {h.reason && `— ${h.reason}`}</span>
              <button onClick={() => removeHoliday(h.id)} className="text-red-500"><FiTrash2 /></button>
            </div>
          ))}
          {holidays.length === 0 && <p className="text-sm text-slate-400">No holidays added.</p>}
        </div>
      </Modal>
    </AdminLayout>
  );
}
