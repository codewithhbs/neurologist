import { useEffect, useState } from 'react';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';

export default function Reports() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [revenue, setRevenue] = useState({ records: [], total: 0 });
  const [doctorPerf, setDoctorPerf] = useState([]);

  const loadRevenue = () => client.get('/reports/revenue', { params: range }).then((res) => setRevenue(res.data));
  useEffect(() => { loadRevenue(); client.get('/reports/doctor-performance').then((res) => setDoctorPerf(res.data.doctors)); }, []);

  return (
    <AdminLayout title="Reports">
      <div className="card p-5 mb-6">
        <h3 className="font-bold text-slate-900 mb-4">Revenue Report</h3>
        <div className="flex gap-3 mb-4">
          <input type="date" className="input !w-auto" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <input type="date" className="input !w-auto" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          <button onClick={loadRevenue} className="btn-primary">Filter</button>
        </div>
        <p className="text-sm text-slate-500 mb-3">Total Paid Revenue: <span className="font-bold text-brand-700">₹{revenue.total}</span></p>
        <DataTable
          columns={[
            { key: 'appointment_code', label: 'ID' },
            { key: 'patient_name', label: 'Patient' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'appointment_date', label: 'Date' },
            { key: 'final_amount', label: 'Amount', render: (r) => `₹${r.final_amount}` },
            { key: 'payment_status', label: 'Status' }
          ]}
          rows={revenue.records}
        />
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-900 mb-4">Doctor Performance</h3>
        <DataTable
          columns={[
            { key: 'name', label: 'Doctor' },
            { key: 'total_appointments', label: 'Total Appointments' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
            { key: 'revenue', label: 'Revenue', render: (r) => `₹${r.revenue}` }
          ]}
          rows={doctorPerf}
        />
      </div>
    </AdminLayout>
  );
}
