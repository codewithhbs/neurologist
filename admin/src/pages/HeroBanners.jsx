import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploadField from '../components/ImageUploadField';

const emptyForm = { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '', display_order: 0, is_mobile: 0 };

export default function HeroBanners() {
  const [banners, setBanners] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => client.get('/hero-banners').then((res) => setBanners(res.data.banners));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (b) => { setForm(b); setEditId(b.id); setModal(true); };

  const save = async () => {
    if (!form.image_url) return toast.error('Banner image is required');
    try {
      if (editId) await client.put(`/hero-banners/${editId}`, form);
      else await client.post('/hero-banners', form);
      toast.success('Banner saved');
      setModal(false);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await client.delete(`/hero-banners/${id}`);
    toast.success('Banner deleted');
    load();
  };

  const toggleActive = async (b) => {
    await client.put(`/hero-banners/${b.id}`, { is_active: b.is_active ? 0 : 1 });
    load();
  };

  return (
    <AdminLayout title="Hero Banners (Website)">
      <p className="text-sm text-slate-500 mb-4">These banners rotate in the homepage hero section slider. Recommended size: 1600×800px (2:1 landscape).</p>
      <div className="flex justify-end mb-4"><button onClick={openCreate} className="btn-primary"><FiPlus /> Add Banner</button></div>

      <DataTable
        columns={[
          { key: 'image_url', label: 'Preview', render: (r) => <img src={r.image_url} alt={r.title} className="w-24 h-12 object-cover rounded-lg" /> },
          { key: 'title', label: 'Title', render: (r) => r.title || '—' },
          { key: 'cta_text', label: 'CTA', render: (r) => r.cta_text ? `${r.cta_text} → ${r.cta_link}` : '—' },
          { key: 'display_order', label: 'Order' },
          { key: 'is_mobile', label: 'Device', render: (r) => r.is_mobile ? 'Mobile' : 'Desktop' },
          { key: 'is_active', label: 'Status', render: (r) => (
            <button onClick={() => toggleActive(r)} className={`badge ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {r.is_active ? 'Active' : 'Inactive'}
            </button>
          ) }
        ]}
        rows={banners}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Banner' : 'Add Banner'} wide>
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Subtitle</label><textarea className="input" rows={2} value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          <ImageUploadField label="Banner Image (2:1 landscape)" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="hero-banners" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">CTA Button Text</label><input className="input" placeholder="e.g. Book Appointment" value={form.cta_text || ''} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></div>
            <div><label className="label">CTA Link</label><input className="input" placeholder="e.g. /appointment" value={form.cta_link || ''} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} /></div>
          </div>
          <div><label className="label">Display Order</label><input type="number" className="input" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_mobile} onChange={(e) => setForm({ ...form, is_mobile: e.target.checked ? 1 : 0 })} /> Show on Mobile (unchecked = Desktop)</label>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Banner</button>
      </Modal>
    </AdminLayout>
  );
}
