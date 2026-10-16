import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiTrash2, FiStar } from 'react-icons/fi';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const load = () => client.get('/reviews').then((res) => setReviews(res.data.reviews));
  useEffect(() => { load(); }, []);

  const toggleApprove = async (r) => { await client.put(`/reviews/${r.id}`, { is_approved: r.is_approved ? 0 : 1 }); toast.success('Updated'); load(); };
  const toggleFeature = async (r) => { await client.put(`/reviews/${r.id}`, { is_featured: r.is_featured ? 0 : 1 }); load(); };
  const remove = async (id) => { if (!confirm('Delete this review?')) return; await client.delete(`/reviews/${id}`); load(); };

  return (
    <AdminLayout title="Reviews">
      <DataTable
        columns={[
          { key: 'patient_name', label: 'Patient' },
          { key: 'doctor_name', label: 'Doctor', render: (r) => r.doctor_name || '—' },
          { key: 'rating', label: 'Rating', render: (r) => '⭐'.repeat(r.rating) },
          { key: 'review_text', label: 'Review', render: (r) => <span className="line-clamp-2 max-w-xs block">{r.review_text}</span> },
          { key: 'is_approved', label: 'Approved', render: (r) => <span className={`badge ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.is_approved ? 'Yes' : 'Pending'}</span> },
          { key: 'is_featured', label: 'Featured', render: (r) => r.is_featured ? '⭐' : '—' }
        ]}
        rows={reviews}
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => toggleApprove(row)} className="btn-outline !px-2 !py-1" title="Toggle approve"><FiCheck /></button>
            <button onClick={() => toggleFeature(row)} className="btn-outline !px-2 !py-1" title="Toggle featured"><FiStar /></button>
            <button onClick={() => remove(row.id)} className="btn-danger !px-2 !py-1"><FiTrash2 /></button>
          </div>
        )}
      />
    </AdminLayout>
  );
}
