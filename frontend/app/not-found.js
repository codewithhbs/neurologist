import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-x py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="btn-primary">Back to Home</Link>
    </section>
  );
}
