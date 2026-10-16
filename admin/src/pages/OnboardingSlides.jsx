import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploader from '../components/ImageUploader';

const emptyForm = { title: '', subtitle: '', image_url: '', display_order: 0 };

export default function OnboardingSlides() {
  const [slides, setSlides] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => client.get('/onboarding-slides').then((res) => setSlides(res.data.slides));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditId(s.id); setModal(true); };

  const save = async () => {
    if (!form.title || !form.image_url) return toast.error('Title and image URL are required');
    try {
      if (editId) await client.put(`/onboarding-slides/${editId}`, form);
      else await client.post('/onboarding-slides', form);
      toast.success('Slide saved');
      setModal(false);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this slide?')) return;
    await client.delete(`/onboarding-slides/${id}`);
    toast.success('Slide deleted');
    load();
  };

  const toggleActive = async (s) => {
    await client.put(`/onboarding-slides/${s.id}`, { is_active: s.is_active ? 0 : 1 });
    load();
  };

  return (
    <AdminLayout title="Onboarding Slides (Mobile App)">
      <p className="text-sm text-slate-500 mb-4">These slides appear on the first launch of the DHIC mobile app (Expo). Recommended image ratio: 3:4 portrait.</p>
      <div className="flex justify-end mb-4"><button onClick={openCreate} className="btn-primary"><FiPlus /> Add Slide</button></div>

      <DataTable
        columns={[
          { key: 'image_url', label: 'Preview', render: (r) => <img src={r.image_url} alt={r.title} className="w-14 h-20 object-cover rounded-lg" /> },
          { key: 'title', label: 'Title' },
          { key: 'subtitle', label: 'Subtitle', render: (r) => <span className="line-clamp-2 max-w-xs block">{r.subtitle}</span> },
          { key: 'display_order', label: 'Order' },
          { key: 'is_active', label: 'Status', render: (r) => (
            <button onClick={() => toggleActive(r)} className={`badge ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {r.is_active ? 'Active' : 'Inactive'}
            </button>
          ) }
        ]}
        rows={slides}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Slide' : 'Add Slide'}>
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Subtitle</label><textarea className="input" rows={2} value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          <ImageUploader label="Slide Image (portrait 3:4)" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="onboarding" />
          <div><label className="label">Display Order</label><input type="number" className="input" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Slide</button>
      </Modal>
    </AdminLayout>
  );
}
