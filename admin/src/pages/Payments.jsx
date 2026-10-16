import { useEffect, useState } from 'react';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';

const STATUS_COLORS = { created: 'bg-amber-100 text-amber-700', paid: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-slate-200 text-slate-600' };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  useEffect(() => { client.get('/payments').then((res) => setPayments(res.data.payments)); }, []);

  return (
    <AdminLayout title="Payments">
      <DataTable
        columns={[
          { key: 'appointment_code', label: 'Appointment ID' },
          { key: 'patient_name', label: 'Patient', render: (r) => `${r.patient_name} (${r.patient_mobile})` },
          { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` },
          { key: 'method', label: 'Method', render: (r) => r.method || '—' },
          { key: 'razorpay_payment_id', label: 'Razorpay Payment ID', render: (r) => r.razorpay_payment_id || '—' },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span> },
          { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleString('en-IN') }
        ]}
        rows={payments}
      />
    </AdminLayout>
  );
}
