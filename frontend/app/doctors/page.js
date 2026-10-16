import { getDoctors } from '@/lib/api';
import DoctorCard from '@/components/DoctorCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Our Doctor',
    description: 'Meet Dr Neeraj Kumar, Senior Consultant Neurologist at Neurocare Clinic, Vasant Kunj, New Delhi — MBBS, MD (Medicine), DM (Neurology).',
    alternates: { canonical: `${SITE_URL}/doctors` }
  };
}

export default async function DoctorsPage() {
  const res = await getDoctors();
  const doctors = res?.doctors || [];

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Doctors', path: '/doctors' }])} />

      {/* Header */}
      <section className="relative bg-brand-900 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="container-x relative">
          <p className="section-eyebrow text-accent-300 mb-2">Meet Your Neurologist</p>
          <h1 className="text-4xl font-extrabold mb-3">Our Doctor</h1>
          <p className="text-brand-100/70 text-sm">Home <span className="mx-1">/</span> Doctors</p>
        </div>
      </section>

      <section className="container-x py-16">
        {doctors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">Doctor profile coming soon.</p>
          </div>
        ) : (
          <div
            className={`grid gap-7 ${
              doctors.length <= 2
                ? 'grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        )}
      </section>
    </>
  );
}