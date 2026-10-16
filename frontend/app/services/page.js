import { getServices, getServiceCategories } from '@/lib/api';
import ServiceCard from '@/components/ServiceCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Neurology Treatments & Services',
    description: 'Explore neurology treatments at Neurocare Clinic, Vasant Kunj, Delhi — epilepsy, headache and migraine, Parkinson’s disease, neuropathy, paralysis, vertigo, memory disorders and more.',
    alternates: { canonical: `${SITE_URL}/services` }
  };
}

export default async function ServicesPage() {
  const [servicesRes, categoriesRes] = await Promise.all([getServices(), getServiceCategories()]);
  const services = servicesRes?.services || [];
  const categories = categoriesRes?.categories || [];

  const grouped = categories
    .map((cat) => ({ ...cat, items: services.filter((s) => s.category_slug === cat.slug) }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }])} />

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
          <p className="section-eyebrow text-accent-300 mb-2">Treatments We Offer</p>
          <h1 className="text-4xl font-extrabold mb-3">Our Neurology Treatments</h1>
          <p className="text-brand-100/70 max-w-xl">
            Comprehensive care for disorders of the brain, nerves, muscles and spine — accurate diagnosis and personalised treatment.
          </p>
        </div>
      </section>

      {/* Quick category jump */}
      {grouped.length > 1 && (
        <section className="border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="container-x flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {grouped.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.slug}`}
                className="shrink-0 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-full border border-slate-200 hover:border-brand-200 transition-colors"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-16">
        {grouped.length > 0 ? (
          grouped.map((cat, i) => (
            <div key={cat.id} id={cat.slug} className={`scroll-mt-20 ${i !== 0 ? 'mt-16 pt-16 border-t border-slate-100' : ''}`}>
              <div className="flex items-baseline gap-3 mb-8">
                <h2 className="text-2xl font-bold text-slate-900">{cat.name}</h2>
                <span className="text-sm text-slate-400">{cat.items.length} treatment{cat.items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cat.items.map((s) => <ServiceCard key={s.id} service={s} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </section>
    </>
  );
}