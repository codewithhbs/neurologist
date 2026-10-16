import { Suspense } from 'react';
import { getClinics, getDoctors } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';
import BookingWizard from '@/components/BookingWizard';

export async function generateMetadata() {
  return {
    title: 'Book Appointment',
    description:
      'Book your neurology appointment online with Dr Neeraj Kumar at Neurocare Clinic, Vasant Kunj, New Delhi. Choose your preferred time slot.',
    alternates: { canonical: `${SITE_URL}/appointment` },
    robots: { index: false, follow: true },
  };
}

export default async function AppointmentPage() {
  const [clinicsRes, doctorsRes] = await Promise.all([getClinics(), getDoctors()]);
  const clinics = clinicsRes?.clinics || [];
  const doctors = doctorsRes?.doctors || [];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Book Appointment', path: '/appointment' },
        ])}
      />

      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0D5CA8]/20 border-t-[#0D5CA8]" />
            Loading booking form...
          </div>
        }
      >
        <BookingWizard clinics={clinics} doctors={doctors} />
      </Suspense>
    </>
  );
}