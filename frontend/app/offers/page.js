import Image from 'next/image';
import Link from 'next/link';
import { getOffers } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';
import { FiTag } from 'react-icons/fi';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Offers & Discounts',
    description: 'Current offers and discount coupons at Neurocare Clinic, Vasant Kunj, New Delhi.',
    alternates: { canonical: `${SITE_URL}/offers` }
  };
}

export default async function OffersPage() {
  const res = await getOffers();
  const offers = res?.offers || [];

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Offers', path: '/offers' }])} />

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
          <p className="section-eyebrow text-accent-300 mb-2">Special Deals</p>
          <h1 className="text-4xl font-extrabold mb-3">Offers & Discounts</h1>
          <p className="text-brand-100/70 max-w-xl">Save more on your consultations with our current offers.</p>
        </div>
      </section>

      <section className="container-x py-16">
        {offers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No active offers right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {offers.map((o) => (
              <div
                key={o.id}
                className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/5"
              >
                <div className="relative w-full aspect-[16/9] bg-brand-50">
                  {o.image_url ? (
                    <Image
                      src={o.image_url}
                      alt={o.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🎁</div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{o.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{o.description}</p>

                  {o.coupon_code && (
                    <div className="flex items-center gap-2 bg-brand-50 border border-dashed border-brand-300 rounded-lg px-4 py-2.5 mb-4">
                      <FiTag className="text-brand-600 shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-500 leading-none mb-0.5">Use code</p>
                        <p className="font-bold text-brand-700 tracking-wide text-sm leading-none">{o.coupon_code}</p>
                      </div>
                    </div>
                  )}

                  <Link href={`/appointment?coupon=${o.coupon_code || ''}`} className="btn-primary w-full text-center">
                    Book & Save
                  </Link>
                </div>

                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-600 transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}