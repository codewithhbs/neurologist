import { getDoctors, getServices, getBlogs } from '@/lib/api';
import { SITE_URL } from '@/lib/schema';

export default async function sitemap() {
  const [doctorsRes, servicesRes, blogsRes] = await Promise.all([
    getDoctors(),
    getServices(),
    getBlogs(1, 200)
  ]);

  const staticRoutes = ['', '/about', '/doctors', '/services', '/blog', '/offers', '/reviews', '/contact', '/appointment'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8
  }));

  const doctorRoutes = (doctorsRes?.doctors || []).map((d) => ({
    url: `${SITE_URL}/doctors/${d.slug}`,
    lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  const serviceRoutes = (servicesRes?.services || []).map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.9
  }));

  const blogRoutes = (blogsRes?.blogs || []).map((b) => ({
    url: `${SITE_URL}/blog/${b.slug}`,
    lastModified: b.published_at ? new Date(b.published_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6
  }));

  return [...staticRoutes, ...doctorRoutes, ...serviceRoutes, ...blogRoutes];
}
