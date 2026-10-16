import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploader from '../components/ImageUploader';
import JoditEditor from 'jodit-react';
const emptyForm = {
  category_id: '', name: '', short_description: '', description: '', icon_url: '', banner_image_url: '',
  base_price: 0, duration_minutes: 30, is_featured: false, display_order: 0, meta_title: '', meta_description: ''
};

export default function Services() {
  const editor = useRef(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [newCat, setNewCat] = useState('');

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typings...'
    }),
    []
  );

  const loadCategories = async () => {
    const res = await client.get('/services');
    setServices(res.data.services);
  };

  useEffect(() => {
    client.get('/services').then((res) => setServices(res.data.services));
    fetch(`${import.meta.env.VITE_API_URL?.replace('/admin', '') || 'https://api.dentalhealthcareandimplantcentre.in/api'}/services/categories/list`)
      .then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => { });
  }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (s) => {
    setForm({ ...s, faqs_json: undefined });
    setEditId(s.id);
    setModal(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, is_featured: !!form.is_featured };
      if (editId) await client.put(`/services/${editId}`, payload);
      else await client.post('/services', payload);
      toast.success('Service saved');
      setModal(false);
      loadCategories();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this service?')) return;
    await client.delete(`/services/${id}`);
    toast.success('Service deactivated');
    loadCategories();
  };

  const addCategory = async () => {
    if (!newCat) return;
    await client.post('/services/categories', { name: newCat });
    toast.success('Category added');
    setNewCat('');
    setCatModal(false);
  };

  return (
    <AdminLayout title="Services">
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => setCatModal(true)} className="btn-outline">+ Category</button>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> Add Service</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category_name', label: 'Category' },
          { key: 'base_price', label: 'Base Price', render: (r) => `₹${r.base_price}` },
          { key: 'duration_minutes', label: 'Duration', render: (r) => `${r.duration_minutes} min` },
          { key: 'is_active', label: 'Status', render: (r) => <span className={`badge ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> }
        ]}
        rows={services}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Service' : 'Add Service'} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Service Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">-- none --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Base Price (₹)</label><input type="number" className="input" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></div>
          <div><label className="label">Duration (min)</label><input type="number" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
          <div className="flex items-center gap-2 mt-6"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /><label className="text-sm">Featured on homepage</label></div>
          <div className="sm:col-span-2"><label className="label">Short Description</label><input className="input" value={form.short_description || ''} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <label className="label">Full Description (HTML)</label>
            <JoditEditor
              ref={editor}
              value={form.description}
              config={config}
              tabIndex={1}
              onBlur={(newContent) => {
                setForm((prev) => ({
                  ...prev,
                  description: newContent,
                }));
              }}
              onChange={(newContent) => {
                setForm((prev) => ({
                  ...prev,
                  description: newContent,
                }));
              }}
            />

          </div>
          <div><label className="label">Icon URL</label><ImageUploader value={form.icon_url} onChange={(url) => setForm({ ...form, icon_url: url })} folder="services" /></div>
          <div><label className="label">Banner Image</label><ImageUploader value={form.banner_image_url} onChange={(url) => setForm({ ...form, banner_image_url: url })} folder="services" /></div>
          <div><label className="label">Meta Title</label><input className="input" value={form.meta_title || ''} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} /></div>
          <div><label className="label">Meta Description</label><input className="input" value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Service</button>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Category">
        <input className="input mb-4" placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        <button onClick={addCategory} className="btn-primary w-full justify-center">Add Category</button>
      </Modal>
    </AdminLayout>
  );
}
