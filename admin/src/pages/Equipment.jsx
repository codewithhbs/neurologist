import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = { name: '', category: '', purchase_date: '', warranty_till: '', last_service_date: '', next_service_date: '', status: 'working', notes: '' };
const STATUS_COLORS = { working: 'bg-green-100 text-green-700', maintenance: 'bg-amber-100 text-amber-700', out_of_order: 'bg-red-100 text-red-700' };

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => client.get('/equipment').then((res) => setItems(res.data.equipment));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (m) => { setForm(m); setEditId(m.id); setModal(true); };

  const save = async () => {
    try {
      if (editId) await client.put(`/equipment/${editId}`, form);
      else await client.post('/equipment', form);
      toast.success('Equipment saved');
      setModal(false);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };
  const remove = async (id) => { if (!confirm('Delete this item?')) return; await client.delete(`/equipment/${id}`); load(); };

  return (
    <AdminLayout title="Equipment">
      <div className="flex justify-end mb-4"><button onClick={openCreate} className="btn-primary"><FiPlus /> Add Equipment</button></div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'next_service_date', label: 'Next Service', render: (r) => r.next_service_date || '—' },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status.replace('_', ' ')}</span> }
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Equipment' : 'Add Equipment'} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Category</label><input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><label className="label">Purchase Date</label><input type="date" className="input" value={form.purchase_date || ''} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
          <div><label className="label">Warranty Till</label><input type="date" className="input" value={form.warranty_till || ''} onChange={(e) => setForm({ ...form, warranty_till: e.target.value })} /></div>
          <div><label className="label">Last Service Date</label><input type="date" className="input" value={form.last_service_date || ''} onChange={(e) => setForm({ ...form, last_service_date: e.target.value })} /></div>
          <div><label className="label">Next Service Date</label><input type="date" className="input" value={form.next_service_date || ''} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="working">Working</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="out_of_order">Out of Order</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save</button>
      </Modal>
    </AdminLayout>
  );
}
