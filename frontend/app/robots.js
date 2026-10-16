import { SITE_URL } from '@/lib/schema';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/appointment', '/login', '/profile', '/api/'] }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
