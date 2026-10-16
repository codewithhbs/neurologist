import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogBySlug, getBlogs } from '@/lib/api';
import JsonLd from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema, SITE_URL } from '@/lib/schema';

export const revalidate = 300;

export async function generateStaticParams() {
  const res = await getBlogs(1, 50);
  return (res?.blogs || []).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }) {
  const res = await getBlogBySlug(params.slug);
  const blog = res?.blog;
  if (!blog) return { title: 'Article Not Found' };

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${blog.slug}` },
    openGraph: { type: 'article', images: blog.cover_image_url ? [blog.cover_image_url] : [] }
  };
}

export default async function BlogDetailPage({ params }) {
  const res = await getBlogBySlug(params.slug);
  if (!res?.blog) notFound();
  const { blog, recentPosts = [] } = res;
  const date = blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <>
      <JsonLd data={articleSchema(blog)} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: blog.title, path: `/blog/${blog.slug}` }])} />

      <section className="bg-brand-50 py-10">
        <div className="container-x">
          <p className="text-slate-500 text-sm mb-2">Home &gt; Blog &gt; {blog.title}</p>
          {blog.category_name && <p className="text-brand-600 font-semibold text-sm uppercase mb-2">{blog.category_name}</p>}
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">{blog.title}</h1>
          <p className="text-slate-500 text-sm">{date} · {blog.author_name}</p>
        </div>
      </section>

      <section className="container-x py-14 grid lg:grid-cols-3 gap-10">
        <article className="lg:col-span-2">
          {blog.cover_image_url && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-card">
              <Image src={blog.cover_image_url} alt={blog.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
        </article>

        <aside>
          <div className="card p-6 mb-6 bg-brand-50 border-brand-100">
            <h3 className="font-bold mb-2 text-slate-900">Need an Appointment?</h3>
            <p className="text-sm text-slate-600 mb-4">Book a consultation with Dr Neeraj Kumar today.</p>
            <Link href="/appointment" className="btn-primary text-sm px-5 py-2.5">Book Now</Link>
          </div>

          {recentPosts.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {recentPosts.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3 group">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-brand-50">
                      {p.cover_image_url && <Image src={p.cover_image_url} alt={p.title} fill className="object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700 line-clamp-2">{p.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(p.published_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
