import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = { name: '', category: '', unit: 'strip', stock_qty: 0, reorder_level: 10, price_per_unit: 0, expiry_date: '', supplier: '' };

export default function Medicines() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => client.get('/medicines').then((res) => setItems(res.data.medicines));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (m) => { setForm(m); setEditId(m.id); setModal(true); };

  const save = async () => {
    try {
      if (editId) await client.put(`/medicines/${editId}`, form);
      else await client.post('/medicines', form);
      toast.success('Medicine saved');
      setModal(false);
      load();
    } catch (e) { toast.error('Failed to save'); }
  };
  const remove = async (id) => { if (!confirm('Delete this item?')) return; await client.delete(`/medicines/${id}`); load(); };

  return (
    <AdminLayout title="Medicines Inventory">
      <div className="flex justify-end mb-4"><button onClick={openCreate} className="btn-primary"><FiPlus /> Add Medicine</button></div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'stock_qty', label: 'Stock', render: (r) => <span className={r.stock_qty <= r.reorder_level ? 'text-red-600 font-semibold' : ''}>{r.stock_qty} {r.unit}</span> },
          { key: 'price_per_unit', label: 'Price/Unit', render: (r) => `₹${r.price_per_unit}` },
          { key: 'expiry_date', label: 'Expiry', render: (r) => r.expiry_date || '—' }
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-outline !px-2 !py-1"><FiEdit2 /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Medicine' : 'Add Medicine'} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Category</label><input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div><label className="label">Stock Quantity</label><input type="number" className="input" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} /></div>
          <div><label className="label">Reorder Level</label><input type="number" className="input" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>
          <div><label className="label">Price / Unit (₹)</label><input type="number" className="input" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} /></div>
          <div><label className="label">Expiry Date</label><input type="date" className="input" value={form.expiry_date || ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          <div><label className="label">Supplier</label><input className="input" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        </div>
        <button onClick={save} className="btn-primary w-full mt-6 justify-center">Save</button>
      </Modal>
    </AdminLayout>
  );
}
