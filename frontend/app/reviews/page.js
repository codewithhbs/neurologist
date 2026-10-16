import { FiStar } from 'react-icons/fi';
import { getReviews } from '@/lib/api';
import TestimonialCard from '@/components/TestimonialCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Patient Reviews & Testimonials',
    description: 'Read what patients say about their experience with Dr Neeraj Kumar at Neurocare Clinic, Vasant Kunj, New Delhi.',
    alternates: { canonical: `${SITE_URL}/reviews` }
  };
}

export default async function ReviewsPage() {
  const res = await getReviews();
  const reviews = res?.reviews || [];
  const avgRating = res?.avg_rating ? parseFloat(res.avg_rating).toFixed(1) : '5.0';

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Reviews', path: '/reviews' }])} />

      <section className="bg-brand-50 py-12">
        <div className="container-x text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Patient Reviews</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex text-amber-400 text-xl">
              {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} className="fill-amber-400" />)}
            </div>
            <span className="font-bold text-slate-800">{avgRating}</span>
            <span className="text-slate-500 text-sm">({res?.total || 0} reviews)</span>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        {reviews.length === 0 ? (
          <p className="text-center text-slate-500">No reviews yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => <TestimonialCard key={r.id} review={r} />)}
          </div>
        )}
      </section>
    </>
  );
}
