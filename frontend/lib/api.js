const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.drneerajkumarneurologist.com/api';

/**
 * Server-side fetch helper. Uses Next.js fetch caching:
 * - revalidate: seconds (ISR) — pass 0 for no caching (dynamic)
 * - default: revalidate every 60s
 */
async function apiFetch(path, { revalidate = 60, cache } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: cache === 'no-store' ? undefined : { revalidate },
      cache
    });
    if (!res.ok) {
      console.error(`API error ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`API fetch failed for ${path}:`, err.message);
    return null;
  }
}

export const getClinics = () => apiFetch('/clinics', { revalidate: 3600 });
export const getClinicBySlug = (slug) => apiFetch(`/clinics/${slug}`, { revalidate: 3600 });

export const getDoctors = () => apiFetch('/doctors', { revalidate: 300 });
export const getDoctorBySlug = (slug) => apiFetch(`/doctors/${slug}`, { revalidate: 300 });

export const getServices = () => apiFetch('/services', { revalidate: 300 });
export const getServiceCategories = () => apiFetch('/services/categories/list', { revalidate: 3600 });
export const getServiceBySlug = (slug) => apiFetch(`/services/${slug}`, { revalidate: 300 });

export const getBlogs = (page = 1, limit = 9) => apiFetch(`/blogs?page=${page}&limit=${limit}`, { revalidate: 300 });
export const getBlogBySlug = (slug) => apiFetch(`/blogs/${slug}`, { revalidate: 300 });
export const getBlogCategories = () => apiFetch('/blogs/categories/list', { revalidate: 3600 });

export const getOffers = () => apiFetch('/offers', { revalidate: 300 });
export const getReviews = (params = '') => apiFetch(`/reviews${params}`, { revalidate: 300 });
export const getSettings = () => apiFetch('/settings', { revalidate: 3600 });
export const getCmsPage = (key) => apiFetch(`/cms/${key}`, { revalidate: 3600 });
export const getHeroBanners = () => apiFetch('/hero-banners');

export const getAvailableSlots = (doctor_id, clinic_id, service_id, date) =>
  apiFetch(`/appointments/available-slots?doctor_id=${doctor_id}&clinic_id=${clinic_id}&service_id=${service_id}&date=${date}`, {
    cache: 'no-store'
  });

export { API_BASE };