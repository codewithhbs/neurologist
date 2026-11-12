
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
  FiCheckCircle,
} from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';

/* ---------- Brand ---------- */

const BLUE = '#2F6FC6';

/* ---------- Content ---------- */

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
  {
    icon: FiAward,
    value: '24+',
    label: 'Years of experience',
    sub: 'In neurology',
  },
  {
    icon: FiStar,
    value: '5.0/5',
    label: 'Patient rating',
    sub: 'Google Reviews',
  },
  {
    icon: FaBrain,
    value: '13',
    label: 'Conditions treated',
    sub: 'Brain, nerve & spine',
  },
  {
    icon: FiUsers,
    value: 'DM',
    label: 'Neurology',
    sub: 'Dr. RML Hospital, Delhi',
  },
];

/* ---------- Component ---------- */

export default function WhyChooseUs() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F4F8FE] py-16 sm:py-20 lg:py-24">

      {/* Background decorations */}
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-[#2F6FC6]/[0.06] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-40 -z-10 h-[450px] w-[450px] rounded-full bg-blue-100/60 blur-3xl" />

      <div className="container-x relative">

        {/* ---------- Section Heading ---------- */}

        <div className="mb-10 grid gap-5 lg:mb-12 lg:grid-cols-2 lg:items-end">

          <div>
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-[#2F6FC6]/15 bg-white px-4 py-2 shadow-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2F6FC6]/10 text-[#2F6FC6]">
                <FaBrain size={14} />
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#2F6FC6]">
                Why Choose Us
              </span>
            </div>

            <h2 className="max-w-xl text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
              Because Your Brain Deserves{' '}
              <span className="text-[#2F6FC6]">
                The Best Care
              </span>
            </h2>
          </div>

          <div className="lg:justify-self-end lg:max-w-md lg:pb-1">
            <p className="text-base leading-8 text-slate-600">
              Deep neurological expertise, careful diagnosis and
              genuine care, so you can get back to living well.
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#2F6FC6]">
              <FiCheckCircle size={17} />
              <span>Your health is our priority</span>
            </div>
          </div>

        </div>

        {/* ---------- Main Layout ---------- */}

        <div className="grid overflow-hidden rounded-[2rem] border border-[#2F6FC6]/10 bg-white shadow-[0_15px_60px_rgba(47,111,198,0.08)] lg:grid-cols-[1fr_340px]">

          {/* ---------- Features ---------- */}

          <div className="p-4 sm:p-6 lg:p-8">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  The Care You Deserve
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Experience the difference in neurological care.
                </p>
              </div>

              <span className="hidden rounded-full bg-[#2F6FC6]/10 px-3 py-1.5 text-xs font-bold text-[#2F6FC6] sm:inline-flex">
                Patient First
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              {FEATURES.map(({ icon: Icon, title, desc }, index) => (
                <div
                  key={title}
                  className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFE] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#2F6FC6]/25 hover:bg-white hover:shadow-[0_12px_30px_rgba(47,111,198,0.09)] sm:p-5"
                >

                  {/* Icon */}
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#2F6FC6]/10 bg-white text-[#2F6FC6] shadow-sm transition-all duration-300 group-hover:border-[#2F6FC6] group-hover:bg-[#2F6FC6] group-hover:text-white">
                    <Icon size={21} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#2F6FC6] sm:text-[15px]">
                        {title}
                      </h4>
                    </div>

                    <p className="mt-2 text-[12px] leading-[1.8] text-slate-600 sm:text-[13px]">
                      {desc}
                    </p>
                  </div>

                  {/* Hover indicator */}
                  <span className="absolute bottom-0 left-5 right-5 h-[2px] origin-left scale-x-0 rounded-full bg-[#2F6FC6] transition-transform duration-300 group-hover:scale-x-100" />

                </div>
              ))}

            </div>
          </div>

          {/* ---------- Stats Sidebar ---------- */}

          <aside className="relative isolate flex flex-col overflow-hidden bg-gradient-to-br from-[#245BA5] via-[#2F6FC6] to-[#167FBF] p-6 text-white sm:p-8 lg:p-7">

            {/* Decorative elements */}
            <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full border-[30px] border-white/[0.07]" />

            <div className="pointer-events-none absolute -bottom-16 -right-12 -z-10 text-[190px] text-white/[0.07]">
              <FaBrain />
            </div>

            {/* Sidebar Heading */}
            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/90">
                <FiAward size={13} />
                Our Expertise
              </span>

              <h3 className="mt-4 text-2xl font-extrabold leading-tight">
                Trusted Care.
                <br />
                Proven Experience.
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Dedicated to providing quality neurological care.
              </p>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-7">

              {STATS.map(({ icon: Icon, value, label, sub }) => (
                <div key={label} className="min-w-0">

                  <dt className="sr-only">{label}</dt>

                  <Icon
                    size={19}
                    className="mb-2 text-white/70"
                  />

                  <dd className="text-3xl font-extrabold tracking-tight">
                    {value}
                  </dd>

                  <p className="mt-1 text-[12px] font-bold leading-snug text-white">
                    {label}
                  </p>

                  <p className="mt-1 text-[11px] leading-snug text-white/65">
                    {sub}
                  </p>

                </div>
              ))}

            </dl>

            {/* CTA */}
            <div className="mt-auto pt-8">

              <div className="mb-5 h-px w-full bg-white/20" />

              <p className="text-base font-extrabold">
                Need a neurology consultation?
              </p>

              <p className="mt-1 text-sm text-white/75">
                Take the first step towards better health.
              </p>

              <Link
                href="/appointment?step=1&pay=clinic"
                className="group mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#245BA5] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#F0F6FF] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Book Appointment

                <FiArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <p className="mt-3 text-center text-[11px] text-white/60">
                Monday – Saturday · 6:00 PM – 8:00 PM
              </p>

            </div>

          </aside>

        </div>

      </div>
    </section>
  );
}
