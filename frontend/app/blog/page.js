import { getBlogs } from '@/lib/api';
import BlogCard from '@/components/BlogCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Neurology Blog & Health Tips',
    description: 'Tips, news and insights on brain, nerve and spine health from Neurocare Clinic, Vasant Kunj, New Delhi.',
    alternates: { canonical: `${SITE_URL}/blog` }
  };
}

export default async function BlogPage({ searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10);
  const res = await getBlogs(page, 9);
  const blogs = res?.blogs || [];
  const total = res?.total || 0;
  const totalPages = Math.ceil(total / 9);

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])} />

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
          <p className="section-eyebrow text-accent-300 mb-2">From Our Clinic</p>
          <h1 className="text-4xl font-extrabold mb-3">Our Blog</h1>
          <p className="text-brand-100/70 max-w-xl">Tips, news and insights for a healthier brain and nervous system.</p>
        </div>
      </section>

      <section className="container-x py-16">
        {blogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No blog posts yet.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-12">
              {blogs.map((b) => <BlogCard key={b.id} blog={b} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <a
                  href={page > 1 ? `/blog?page=${page - 1}` : undefined}
                  aria-disabled={page <= 1}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm transition-colors ${
                    page <= 1
                      ? 'border-slate-100 text-slate-300 pointer-events-none'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  <FiChevronLeft />
                </a>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <a
                    key={i}
                    href={`/blog?page=${i + 1}`}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-brand-600 text-white shadow shadow-brand-600/30'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    {i + 1}
                  </a>
                ))}

                <a
                  href={page < totalPages ? `/blog?page=${page + 1}` : undefined}
                  aria-disabled={page >= totalPages}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm transition-colors ${
                    page >= totalPages
                      ? 'border-slate-100 text-slate-300 pointer-events-none'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  <FiChevronRight />
                </a>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}