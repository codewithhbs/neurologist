
import Link from 'next/link';
import Image from 'next/image';
import {
  FiStar,
  FiCheckCircle,
  FiAward,
  FiShield,
  FiHeart,
  FiUsers,
  FiClipboard,
  FiArrowRight,
  FiUser,
} from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';

/* ---------- helpers ---------- */

const isUrl = (value) =>
  typeof value === 'string' && value.trim() !== '';

const DEFAULT_HIGHLIGHTS = [
  'Migraine, epilepsy, stroke & nerve disorders',
  "Parkinson's disease, memory problems & dizziness",
  'Accurate diagnosis. Personalised treatment.',
];

const DEFAULT_CONDITIONS = [
  'Migraine & headache disorders',
  'Epilepsy & seizure disorders',
  "Parkinson's disease",
  'Memory problems & dementia',
  'Stroke & vascular disorders',
  'Spine & nerve-related conditions',
];

const TRUST_POINTS = [
  { icon: FaBrain, label: 'Accurate', secondLine: 'Diagnosis' },
  { icon: FiShield, label: 'Evidence-Based', secondLine: 'Treatment' },
  { icon: FiUsers, label: 'Patient-Centered', secondLine: 'Care' },
  { icon: FiAward, label: 'Experienced', secondLine: 'Neurologist' },
  { icon: FiHeart, label: 'Trusted', secondLine: 'Care' },
];

const STATS = [
  { icon: FiAward, value: '24+', label: 'Years of Experience' },
  { icon: FiStar, value: '5.0', label: 'Google Rating' },
  { icon: FaBrain, value: 'DM', label: 'Neurology' },
  { icon: FiUsers, value: 'IAN & AAN', label: 'Member' },
];

/* ---------- doctor portrait ---------- */

function DoctorPhoto({ doctor, sizes }) {
  const name = doctor.name || 'Neurologist';

  if (isUrl(doctor.photo_url)) {
    return (
      <Image
        src={doctor.photo_url}
        alt={`Portrait of ${name}`}
        fill
        sizes={sizes}
        priority
        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-teal-50">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white bg-white/80 text-brand-600 shadow-sm">
        <FiUser className="h-12 w-12" />
      </div>

      <p className="mt-4 text-lg font-bold text-slate-800">{name}</p>
      <p className="mt-1 text-sm text-slate-500">Neurology Specialist</p>
    </div>
  );
}

/* ---------- reusable icon badge ---------- */

function IconBadge({ children, color = 'blue' }) {
  const colorClasses =
    color === 'teal'
      ? 'bg-teal-50 text-teal-600 ring-teal-100'
      : 'bg-blue-50 text-brand-600 ring-blue-100';

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${colorClasses}`}
    >
      {children}
    </span>
  );
}

/* ---------- doctor credentials ---------- */

function DoctorCredentials({ doctor }) {
  const qualifications = [
    {
      icon: FiUsers,
      title: 'Professional Membership',
      description:
        doctor.membership ||
        'Indian & American Academy of Neurology',
    },
    {
      icon: FiClipboard,
      title: 'Detailed Evaluation',
      description:
        'Clear explanations and a thorough neurological assessment.',
    },
    {
      icon: FiUser,
      title: 'Personalised Treatment',
      description:
        'Individual care plans tailored to each patient.',
    },
  ];

  return (
    <div className="space-y-5">
      {qualifications.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex items-start gap-3.5">
          <IconBadge color="blue">
            <Icon className="h-6 w-6" />
          </IconBadge>

          <div className="min-w-0 pt-0.5">
            <h4 className="text-sm font-bold text-slate-800 sm:text-base">
              {title}
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- specialty panel ---------- */

function SpecialtyPanel({ doctor }) {
  const conditions =
    doctor.conditions?.length > 0
      ? doctor.conditions
      : DEFAULT_CONDITIONS;

  return (
    <aside className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50/70 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <IconBadge color="teal">
          <FaBrain className="h-6 w-6" />
        </IconBadge>

        <h4 className="text-lg font-extrabold leading-snug text-brand-800">
          Specialised in Treating
        </h4>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-600">
        Disorders of the brain, nerves, muscles and spine.
      </p>

      <ul className="space-y-3">
        {conditions.map((condition) => (
          <li
            key={condition}
            className="flex items-start gap-2.5 text-sm leading-5 text-slate-600"
          >
            <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
            <span>{condition}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ---------- premium featured doctor card ---------- */

function FeaturedDoctorCard({ doctor }) {
  const highlights = doctor.highlights?.length
    ? doctor.highlights
    : DEFAULT_HIGHLIGHTS;

  const gallery = (doctor.gallery || []).filter(isUrl);

  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      aria-label={`View profile of ${doctor.name || 'neurologist'}`}
      className="group block overflow-hidden rounded-[26px] border border-white bg-white p-3 shadow-[0_8px_35px_rgba(37,99,235,0.08)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(37,99,235,0.13)] sm:p-4"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.92fr_1.12fr_0.9fr] lg:gap-7">
        {/* Portrait */}

        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 sm:min-h-[400px] lg:min-h-[440px]">
          <DoctorPhoto
            doctor={doctor}
            sizes="(max-width: 1024px) 100vw, 33vw"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/70 via-blue-950/20 to-transparent px-5 pb-5 pt-20">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
                <FiAward className="h-4 w-4" />
              </span>

              <span className="text-xs font-bold leading-5 text-brand-900">
                {doctor.qualification ||
                  'MBBS, MD, DM (Neurology)'}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor information */}

        <div className="flex min-w-0 flex-col justify-center py-3 lg:py-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-0.5 w-7 rounded-full bg-teal-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-600">
              Senior Consultant Neurologist
            </span>
          </div>

          {doctor.rating && (
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {doctor.rating} Rating
            </span>
          )}

          <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-3xl">
            {doctor.name}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {doctor.qualification ||
              'MBBS, MD (General Medicine), DM (Neurology)'}
          </p>

          <div className="mb-6 mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm">
            <FaBrain className="h-3.5 w-3.5" />
            {doctor.specialization || 'Neurology'}
          </div>

          <div className="mb-5">
            <DoctorCredentials doctor={doctor} />
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            {highlights.map((point) => (
              <div
                key={point}
                className="flex items-start gap-2 text-sm leading-5 text-slate-600"
              >
                <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          {gallery.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {gallery.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200"
                >
                  <Image
                    src={src}
                    alt={`${doctor.name} gallery ${index + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conditions */}

        <div className="flex flex-col justify-center border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <SpecialtyPanel doctor={doctor} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 px-2 pt-4">
        <span className="text-sm font-semibold text-slate-500 transition-colors group-hover:text-brand-700">
          Explore doctor profile
        </span>

        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-brand-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <FiArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

/* ---------- additional doctor card ---------- */

function DoctorGridCard({ doctor }) {
  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-sky-100 to-blue-50">
        <DoctorPhoto
          doctor={doctor}
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {doctor.rating && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            <FiStar className="h-3 w-3 fill-amber-400 text-amber-400" />
            {doctor.rating}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-extrabold text-brand-900">
          {doctor.name}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {doctor.qualification}
        </p>

        <p className="mt-3 text-sm font-semibold text-brand-600">
          {doctor.specialization}
        </p>

        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
          View Profile
          <FiArrowRight className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* ---------- trust statistics ---------- */

function TrustStatistics() {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/90 via-white to-teal-50/70 shadow-sm lg:grid-cols-4">
      {STATS.map(({ icon: Icon, value, label }, index) => (
        <div
          key={label}
          className={`flex items-center justify-center gap-3 px-3 py-5 sm:px-5 sm:py-6 ${
            index % 2 === 0 ? 'border-r border-sky-100' : ''
          } ${
            index < 2 ? 'border-b border-sky-100 lg:border-b-0' : ''
          } ${
            index === 1 ? 'lg:border-r' : ''
          } ${
            index === 2 ? 'lg:border-r lg:border-sky-100' : ''
          }`}
        >
          <Icon className="h-7 w-7 shrink-0 text-teal-500 sm:h-8 sm:w-8" />

          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-brand-800 sm:text-xl">
              {value}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- main section ---------- */

export default function MeetOurTeam({ doctors = [] }) {
  if (!doctors.length) return null;

  const featured = doctors.slice(0, 2);
  const useFeatureLayout = doctors.length <= 2;

  return (
    <section
      aria-labelledby="meet-neurologist-heading"
      className="relative isolate overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-cyan-50/40 py-14 sm:py-20 lg:py-24"
    >
      {/* Decorative background elements */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-16 hidden h-72 w-72 rounded-full border-[40px] border-sky-100/50 lg:block"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 hidden h-80 w-80 rounded-full bg-gradient-to-tr from-blue-100/50 to-transparent lg:block"
      />

      <FaBrain
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-20 hidden -translate-y-1/4 text-[200px] text-brand-500/[0.04] lg:block"
      />

      <div className="container-x relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}

        <div className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
          <div className="mb-5 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-brand-400" />

            <span className="rounded-full bg-gradient-to-r from-brand-600 to-blue-500 px-5 py-2 text-[11px] font-extrabold tracking-wider text-white shadow-sm">
              MEET YOUR NEUROLOGIST
            </span>

            <span className="h-px w-8 bg-brand-400" />
          </div>

          <h2
            id="meet-neurologist-heading"
            className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
          >
            Expert Neurology Care by
            <span className="mt-1 block bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              {featured[0]?.name || 'Dr Neeraj Kumar'}
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Compassionate care. Deep expertise. Better outcomes for
            brain, nerve and spine health.
          </p>
        </div>

        {/* Care benefits */}

        <div className="mx-auto mb-9 grid max-w-5xl grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:mb-12 lg:grid-cols-5 lg:gap-5">
          {TRUST_POINTS.map(({ icon: Icon, label, secondLine }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/60 p-3 transition-colors hover:bg-white sm:border-0 sm:bg-transparent sm:p-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-sky-100 text-brand-600 ring-1 ring-blue-100">
                <Icon className="h-5 w-5" />
              </span>

              <span className="text-xs font-semibold leading-5 text-brand-900 sm:text-sm">
                {label}
                <span className="block">{secondLine}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Featured doctor */}

        {useFeatureLayout ? (
          <div className="mb-6">
            {featured.map((doctor) => (
              <div key={doctor.id} className="mb-6 last:mb-0">
                <FeaturedDoctorCard doctor={doctor} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorGridCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {/* Trust statistics */}

        <div className="mt-5">
          <TrustStatistics />
        </div>

        {/* Call to action */}

        <div className="mt-8 flex justify-center">
          <Link
            href="/doctors"
            className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-brand-600 bg-white px-7 py-3 text-sm font-bold text-brand-700 shadow-sm transition-all duration-300 hover:bg-brand-600 hover:text-white hover:shadow-lg hover:shadow-brand-600/20 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            View Doctor Profile
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Clinic location */}

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Neurocare Clinic · Vasant Kunj, New Delhi
        </p>
      </div>
    </section>
  );
}
