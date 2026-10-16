import Link from 'next/link';
import Image from 'next/image';

export default function BlogCard({ blog }) {
  const date = blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  return (
    <Link href={`/blog/${blog.slug}`} className="card overflow-hidden hover:shadow-lg transition-shadow group block">
      <div className="relative w-full aspect-[16/10] bg-brand-50">
        {typeof blog.cover_image_url === 'string' && blog.cover_image_url.trim() ? (
          <Image src={blog.cover_image_url} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300 text-4xl bg-gradient-to-br from-brand-50 to-accent-50">📰</div>
        )}
      </div>
      <div className="p-5">
        {blog.category_name && <p className="text-xs text-brand-600 font-semibold uppercase mb-1">{blog.category_name}</p>}
        <h3 className="font-bold text-slate-900 line-clamp-2 mb-2">{blog.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-2">{blog.excerpt}</p>
        <p className="text-xs text-slate-400">{date}</p>
      </div>
    </Link>
  );
}
