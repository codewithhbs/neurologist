// Single source of truth for fallback clinic details (used when API settings are empty)
export const CLINIC = {
  name: 'Neurocare Clinic',
  doctor: 'Dr Neeraj Kumar',
  doctorTitle: 'Senior Consultant Neurologist',
  tagline: 'Expert Neurology Care in Vasant Kunj, New Delhi',
  phone: '7042564433',
  whatsapp: '917042564433',
  email: 'neurocareclinic@gmail.com',
  address:
    'Shop No. 2 (LSC B-1), Ground Floor, Pocket 1, Sector B, Near SBI ATM, Vasant Kunj, New Delhi – 110070',
  locality: 'Vasant Kunj, New Delhi',
  mapsUrl: 'https://maps.app.goo.gl/qpJNYKBd39XqGJ9a7',
  mapsEmbed:
    'https://www.google.com/maps?q=28.522594952899,77.159592211246&output=embed',
  timing: 'Mon – Sat: 6:00 PM – 8:00 PM',
  timingNote: 'Sunday: Closed',
  facebook: 'https://www.facebook.com/people/Neurocare-clinic/61561380222927/',
  instagram: 'https://www.instagram.com/neurocare_clinic_/',
};

export const TREATMENT_LINKS = [
  { href: '/services/epilepsy-treatment', label: 'Epilepsy Treatment' },
  { href: '/services/headache-facial-pain-treatment', label: 'Headache & Facial Pain' },
  { href: '/services/parkinsons-disease-treatment', label: "Parkinson's Disease" },
  { href: '/services/neck-back-pain-treatment', label: 'Neck & Back Pain' },
  { href: '/services/giddiness-vertigo-neurology', label: 'Giddiness & Vertigo' },
  { href: '/services/cognitive-disorder-treatment', label: 'Cognitive Disorder' },
];
