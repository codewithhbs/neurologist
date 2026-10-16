import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageUploader from '../components/ImageUploader';
import JoditEditor from 'jodit-react';
const emptyForm = { title: '', excerpt: '', content: '', cover_image_url: '', author_name: 'Neurocare Clinic', is_published: false, meta_title: '', meta_description: '' };

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const editor = useRef(null);
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typings...'
    }),
    []
  );
  const load = () => client.get('/blogs').then((res) => setBlogs(res.data.blogs));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (b) => { setForm(b); setEditId(b.id); setModal(true); };

  const save = async () => {
    try {
      const payload = { ...form, is_published: !!form.is_published };
      if (editId) await client.put(`/blogs/${editId}`, payload);
      else await client.post('/blogs', payload);
      toast.success('Blog saved');
      setModal(false);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };
  const remove = async (id) => { if (!confirm('Delete this blog?')) return; await client.delete(`/blogs/${id}`); load(); };

  return (
    <AdminLayout title="Blogs">
      <div className="flex justify-end mb-4"><button onClick={openCreate} className="btn-primary"><FiPlus /> Add Blog</button></div>
      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'is_published', label: 'Status', render: (r) => <span className={`badge ${r.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.is_published ? 'Published' : 'Draft'}</span> },
          { key: 'views', label: 'Views' },
          { key: 'published_at', label: 'Published', render: (r) => r.published_at ? new Date(r.published_at).toLocaleDateString('en-IN') : '—' }
        ]}
        rows={blogs}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Blog' : 'Add Blog'} wide>
        <div className="grid gap-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Excerpt</label><input className="input" value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
          <div><label className="label">Content (HTML)</label>
           <JoditEditor
              ref={editor}
              value={form.content}
              config={config}
              tabIndex={1}
              onBlur={(newContent) => {
                setForm((prev) => ({
                  ...prev,
                  content: newContent,
                }));
              }}
              onChange={(newContent) => {
                setForm((prev) => ({
                  ...prev,
                  content: newContent,
                }));
              }}
            />
          </div>
                   
          <div><label className="label">Cover Image</label><ImageUploader value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} folder="blogs" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Meta Title</label><input className="input" value={form.meta_title || ''} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} /></div>
            <div><label className="label">Meta Description</label><input className="input" value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /><label className="text-sm">Publish now</label></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save Blog</button>
      </Modal>
    </AdminLayout>
  );
}
