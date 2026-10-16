const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurocareclinic.in';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const clinicSchema = (settings = {}) => ({
  '@context': 'https://schema.org',
  '@type': ['MedicalClinic', 'Physician'],
  medicalSpecialty: 'Neurology',
  name: settings.site_name || 'Neurocare Clinic | Dr Neeraj Kumar',
  image: settings.logo_url || `${SITE_URL}/logo.png`,
  '@id': SITE_URL,
  url: SITE_URL,
  telephone: settings.phone ? `+91${String(settings.phone).replace(/^\+?91/, '')}` : '+917042564433',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop No. 2 (LSC B-1), Ground Floor, Pocket 1, Sector B, Near SBI ATM, Vasant Kunj',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    postalCode: '110070',
    addressCountry: 'IN'
  },
  geo: { '@type': 'GeoCoordinates', latitude: 28.522594952899, longitude: 77.159592211246 },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', reviewCount: '13' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: WEEKDAYS, opens: '18:00', closes: '20:00' }
  ],
  sameAs: [
    'https://www.instagram.com/neurocare_clinic_/',
    'https://www.facebook.com/people/Neurocare-clinic/61561380222927/',
    'https://maps.app.goo.gl/qpJNYKBd39XqGJ9a7'
  ]
});

export const doctorSchema = (doctor) => ({
  '@context': 'https://schema.org',
  '@type': 'Physician',
  name: doctor.name,
  jobTitle: doctor.specialization,
  medicalSpecialty: 'Neurology',
  description: doctor.bio,
  image: doctor.photo_url || undefined,
  url: `${SITE_URL}/doctors/${doctor.slug}`,
  worksFor: { '@type': 'MedicalClinic', name: 'Neurocare Clinic' }
});
export const serviceSchema = (service) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalProcedure',
  name: service.name,
  description: service.short_description,
  url: `${SITE_URL}/services/${service.slug}`
});

export const articleSchema = (blog) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: blog.title,
  description: blog.excerpt,
  image: blog.cover_image_url,
  author: { '@type': 'Organization', name: blog.author_name },
  datePublished: blog.published_at,
  dateModified: blog.updated_at || blog.published_at,
  mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`
});

export const faqSchema = (faqs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a }
  }))
});

export const breadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`
  }))
});

export { SITE_URL };
