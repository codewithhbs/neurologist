import Link from 'next/link';
import {
  FiUser,
  FiCpu,
  FiHeart,
  FiUsers,
  FiShield,
  FiClock,
  FiAward,
  FiStar,
  FiArrowRight,
} from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';

/* ---------- content data ---------- */

const FEATURES = [
  {
    icon: FiUser,
    title: 'Expert Neurologist',
    desc: 'Senior Consultant Neurologist with 24+ years of experience in neurology and healthcare.',
  },
  {
    icon: FiCpu,
    title: 'Accurate Diagnosis',
    desc: 'Detailed neurological evaluation to find the root cause before treatment begins.',
  },
  {
    icon: FiHeart,
    title: 'Compassionate Care',
    desc: 'Patient-first approach with time to listen, explain and answer your questions.',
  },
  {
    icon: FiUsers,
    title: 'Personalised Treatment',
    desc: 'Treatment plans tailored to your condition, age, lifestyle and long-term goals.',
  },
  {
    icon: FiShield,
    title: 'Evidence-Based Medicine',
    desc: 'Modern, guideline-based treatment for epilepsy, stroke, migraine and nerve disorders.',
  },
  {
    icon: FiClock,
    title: 'Evening Consultations',
    desc: 'Convenient evening slots Monday to Saturday, 6:00 PM – 8:00 PM.',
  },
];

const STATS = [
  { icon: FiAward, value: '24+', label: 'Years of experience', sub: 'In neurology' },
  { icon: FiStar, value: '5.0/5', label: 'Patient rating', sub: 'Google Reviews' },
  { icon: FaBrain, value: '13', label: 'Conditions treated', sub: 'Brain, nerve & spine' },
  { icon: FiUsers, value: 'DM', label: 'Neurology', sub: 'Dr. RML Hospital, Delhi' },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-gradient-to-b from-brand-50/50 to-white py-10 sm:py-12 lg:py-16">
      <div className="container-x">
        {/* ---------- heading ---------- */}
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-10 mb-6 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
                <FaBrain className="text-xs" aria-hidden="true" />
              </span>
              Why choose us
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight text-balance">
              Because your brain deserves the best care
            </h2>
          </div>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed lg:max-w-md lg:justify-self-end">
            Deep neurological expertise, careful diagnosis and genuine care, so you can get back to
            living well.
          </p>
        </div>

        {/* ---------- one joined panel: features + stats/CTA ---------- */}
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_340px]">
          {/* features - hairline grid made with gap-px */}
          <ul className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="group flex gap-3 bg-white p-4 transition-colors hover:bg-brand-50/60 sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                  <Icon className="text-xl" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-snug text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* stats + CTA */}
          <div className="relative flex flex-col overflow-hidden bg-brand-gradient p-5 text-white sm:p-6">
            <FaBrain
              className="pointer-events-none absolute -bottom-6 -right-6 text-[150px] text-white/10"
              aria-hidden="true"
            />

            <dl className="relative grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-2">
              {STATS.map(({ icon: Icon, value, label, sub }) => (
                <div key={label} className="min-w-0">
                  <dt className="sr-only">{label}</dt>
                  <Icon className="mb-1 text-lg text-white/70" aria-hidden="true" />
                  <dd className="text-2xl font-extrabold leading-none sm:text-[1.75rem]">
                    {value}
                  </dd>
                  <p className="mt-1 text-sm font-semibold leading-snug">{label}</p>
                  <p className="text-xs leading-snug text-white/75">{sub}</p>
                </div>
              ))}
            </dl>

            <div className="relative mt-5 flex flex-col gap-3 border-t border-white/25 pt-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start lg:justify-start">
              <div>
                <p className="text-base font-bold leading-snug">Need a neurology consultation?</p>
                <p className="text-sm text-white/85">Book your appointment today.</p>
              </div>
              <Link
                href="/appointment?step=1&pay=clinic"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Book appointment <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}