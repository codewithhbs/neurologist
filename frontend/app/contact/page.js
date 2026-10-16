import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { CLINIC } from '@/lib/clinic';
import { getSettings } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Contact Us',
    description: 'Contact Neurocare Clinic | Dr Neeraj Kumar, Senior Consultant Neurologist in Vasant Kunj, New Delhi. Call, WhatsApp or visit us to book your consultation.',
    alternates: { canonical: `${SITE_URL}/contact` }
  };
}

export default async function ContactPage() {
  const settingsRes = await getSettings();
  const settings = settingsRes?.settings || {};

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact Us', path: '/contact' }])} />

      {/* Header */}
      <section className="relative bg-brand-900 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="container-x relative">
          <p className="section-eyebrow text-accent-300 mb-2">Reach Out</p>
          <h1 className="text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-brand-100/70 max-w-xl">We'd love to hear from you. Reach out anytime.</p>
        </div>
      </section>

      <section className="container-x py-16 grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="space-y-4 mb-8">
            {[
              [FiMapPin, 'Address', settings.address || CLINIC.address],
              [FiPhone, 'Phone', `+91 ${settings.phone || CLINIC.phone}`],
              [FiMail, 'Email', settings.email || CLINIC.email],
              [FiClock, 'Clinic Timing', settings.clinic_timing_text || `${CLINIC.timing} · ${CLINIC.timingNote}`]
            ].map(([Icon, title, val]) => (
              <div
                key={title}
                className="group flex items-start gap-4 bg-white border border-slate-100 rounded-xl p-4 transition-all duration-300 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-600/5"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 text-lg shrink-0 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <Icon />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600">{val}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href={`https://wa.me/${settings.whatsapp || CLINIC.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp inline-flex items-center gap-2"
          >
            <FaWhatsapp /> Chat on WhatsApp
          </a>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-card border border-slate-100 h-80 lg:h-full min-h-[420px]">
          <iframe
            title="Clinic Location"
            src={CLINIC.mapsEmbed}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}