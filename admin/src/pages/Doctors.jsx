import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSettings } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploader from '../components/ImageUploader';

const emptyForm = { name: '', qualification: '', specialization: '', bio: '', experience_years: 0, rating: 4.8, photo_url: '', registration_no: '', consultation_fee: '' };

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => client.get('/doctors').then((res) => setDoctors(res.data.doctors));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (d) => { setForm(d); setEditId(d.id); setModal(true); };

  const save = async () => {
    try {
      if (editId) await client.put(`/doctors/${editId}`, form);
      else await client.post('/doctors', form);
      toast.success('Doctor saved');
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this doctor?')) return;
    await client.delete(`/doctors/${id}`);
    toast.success('Doctor deactivated');
    load();
  };

  return (
    <AdminLayout title="Doctors">
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="btn-primary"><FiPlus /> Add Doctor</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'qualification', label: 'Qualification' },
          { key: 'specialization', label: 'Specialization' },
          { key: 'experience_years', label: 'Experience', render: (r) => `${r.experience_years} yrs` },
          { key: 'rating', label: 'Rating' },
          { key: 'consultation_fee', label: 'Fee', render: (r) => `₹${r.consultation_fee || 0}` }
        ]}
        rows={doctors}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <Link to={`/doctors/${row.id}`} className="btn-outline !px-2 !py-1"><FiSettings /></Link>
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Doctor' : 'Add Doctor'} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Qualification</label><input className="input" value={form.qualification || ''} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
          <div><label className="label">Specialization</label><input className="input" value={form.specialization || ''} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          <div><label className="label">Experience (years)</label><input type="number" className="input" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></div>
          <div><label className="label">Rating</label><input type="number" step="0.1" max="5" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
          <div><label className="label">Registration No.</label><input className="input" value={form.registration_no || ''} onChange={(e) => setForm({ ...form, registration_no: e.target.value })} /></div>
          <div><label className="label">Consultation Fee ₹</label><input type="number" className="input" value={form.consultation_fee || ''} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} /></div>
          <div><ImageUploader label="Photo" value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} folder="doctors" /></div>
          <div className="sm:col-span-2"><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Doctor</button>
      </Modal>
    </AdminLayout>
  );
}
