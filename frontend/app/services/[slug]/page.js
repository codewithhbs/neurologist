import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiCheckCircle, FiCalendar, FiChevronDown, FiTag, FiArrowRight } from 'react-icons/fi';
import { getServiceBySlug, getServices } from '@/lib/api';
import DoctorCard from '@/components/DoctorCard';
import JsonLd from '@/components/JsonLd';
import { serviceSchema, faqSchema, breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 300;

export async function generateStaticParams() {
  const res = await getServices();
  return (res?.services || []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const res = await getServiceBySlug(params.slug);
  const service = res?.service;
  if (!service) return { title: 'Service Not Found' };

  return {
    title: service.meta_title || service.name,
    description: service.meta_description || service.short_description,
    alternates: { canonical: `${SITE_URL}/services/${service.slug}` },
    openGraph: { images: service.banner_image_url ? [service.banner_image_url] : [] }
  };
}

export default async function ServiceDetailPage({ params }) {
  const res = await getServiceBySlug(params.slug);
  if (!res?.service) notFound();
  const { service, doctors = [] } = res;
  const faqs = typeof service.faqs_json === 'string' ? JSON.parse(service.faqs_json) : (service.faqs_json || []);

  const fees = doctors.map((d) => parseFloat(d.consultation_fee)).filter((f) => Number.isFinite(f) && f > 0);
  const minFee = fees.length ? Math.min(...fees) : null;

  return (
    <>
      <JsonLd data={serviceSchema(service)} />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: service.name, path: `/services/${service.slug}` }])} />

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
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="container-x relative grid md:grid-cols-[1fr,320px] gap-8 items-center">
          <div>
            <p className="text-brand-100/60 text-sm mb-2">
              Home <span className="mx-1">/</span> Services <span className="mx-1">/</span> {service.name}
            </p>
            <h1 className="text-4xl font-extrabold mb-3">{service.name}</h1>
            <p className="text-brand-100/70 max-w-xl">{service.short_description}</p>
          </div>

          <div className="bg-white text-center rounded-2xl p-6 shadow-xl">
            {minFee !== null ? (
              <>
                <p className="text-xs text-slate-500 mb-1">Consultation fee from</p>
                <p className="text-3xl font-extrabold text-brand-600 mb-1">₹{minFee}</p>
                <p className="text-[11px] text-slate-400 mb-4">Set by your chosen doctor's profile</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800 mb-1">Ready when you are</p>
                <p className="text-[12px] text-slate-500 mb-4">Consultation fee is set by the doctor you pick</p>
              </>
            )}
            <Link
              href="/appointment"
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <FiCalendar /> Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      <section className="container-x py-16 grid lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2">
          {service.banner_image_url && (
            <div className="relative w-full aspect-[14/9] rounded-2xl overflow-hidden mb-8 shadow-card">
              <Image src={service.banner_image_url} alt={service.name} fill className="object-cover" priority />
            </div>
          )}

          <div className="prose prose-slate max-w-none mb-12" dangerouslySetInnerHTML={{ __html: service.description }} />

          {faqs.length > 0 && (
            <>
              <p className="section-eyebrow mb-2">Common Questions</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group bg-white border border-slate-100 rounded-xl px-5 py-4 transition-colors hover:border-brand-100"
                  >
                    <summary className="font-semibold text-slate-800 cursor-pointer flex items-center justify-between gap-4 list-none">
                      {f.q}
                      <FiChevronDown className="text-brand-600 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Why Choose Us</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {['Accurate, evidence-based diagnosis', 'One transparent consultation fee per doctor', 'Clear explanation of your condition', 'Convenient evening slots, Mon–Sat'].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <FiCheckCircle className="text-brand-600 mt-0.5 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {doctors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Specialists for {service.name}</h3>
                {minFee !== null && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1">
                    <FiTag size={11} /> from ₹{minFee}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
              </div>
              <Link
                href="/appointment"
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Book with any of them <FiArrowRight size={14} />
              </Link>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}