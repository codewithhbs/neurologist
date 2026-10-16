import { useEffect, useState } from 'react';
import { FiCalendar, FiUsers, FiDollarSign, FiClock } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import client from '../api/client';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/dashboard').then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <AdminLayout title="Dashboard"><p className="text-slate-400">Loading...</p></AdminLayout>;

  const { stats, upcoming, lowStock, revenueTrend, topServices } = data;

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Today's Appointments" value={stats.todayAppointments} accent="brand" />
        <StatCard icon={FiUsers} label="Total Patients" value={stats.totalPatients} accent="green" />
        <StatCard icon={FiDollarSign} label="This Month's Revenue" value={`₹${stats.monthRevenue}`} accent="amber" />
        <StatCard icon={FiClock} label="Pending Appointments" value={stats.pendingAppointments} accent="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Top Services</h3>
          <div className="space-y-3">
            {topServices?.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className="text-slate-600">{s.name}</span>
                <span className="font-semibold text-brand-700">{s.bookings}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Upcoming Appointments</h3>
          <div className="space-y-3">
            {upcoming?.length === 0 && <p className="text-sm text-slate-400">No upcoming appointments.</p>}
            {upcoming?.map((a) => (
              <div key={a.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <p className="font-medium text-slate-800">{a.patient_name} — {a.service_name}</p>
                  <p className="text-xs text-slate-400">{a.doctor_name} · {a.appointment_date} {a.start_time}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700">{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Low Stock Medicines</h3>
          <div className="space-y-3">
            {lowStock?.length === 0 && <p className="text-sm text-slate-400">All stocked up!</p>}
            {lowStock?.map((m) => (
              <div key={m.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium text-slate-800">{m.name}</p>
                <span className="badge bg-red-50 text-red-600">{m.stock_qty} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
