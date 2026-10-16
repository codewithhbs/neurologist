import { FiCheckCircle, FiTarget, FiEye, FiHeart } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/schema';

export async function generateMetadata() {
  return {
    title: 'About Us',
    description: 'Learn about Neurocare Clinic and Dr Neeraj Kumar, Senior Consultant Neurologist in Vasant Kunj, New Delhi — our mission, values and patient-first neurology care.',
    alternates: { canonical: `${SITE_URL}/about` }
  };
}

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about' }])} />

      {/* Header */}
      <section className="relative bg-brand-900 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="container-x relative">
          <p className="section-eyebrow text-accent-300 mb-2">About Neurocare Clinic</p>
          <h1 className="text-4xl font-extrabold mb-3">A Clinic Built Around Your Comfort</h1>
          <p className="text-brand-100/70 text-sm">Home <span className="mx-1">/</span> About Us</p>
        </div>
      </section>

      {/* About content */}
      <section className="container-x py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/about.png" alt="Neurocare Clinic" className="h-4/5 w-auto object-contain" />
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-5 border border-slate-100 hidden sm:block">
            <p className="text-3xl font-extrabold text-brand-600 leading-none">24+</p>
            <p className="text-xs text-slate-500 mt-1">Years of Clinical Experience</p>
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-2">Who We Are</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Care That Feels <span className="text-brand-600">Personal</span>
          </h2>
          <p className="text-slate-600 mb-4">
            Neurocare Clinic, led by Dr Neeraj Kumar — Senior Consultant Neurologist — is located in Vasant Kunj, New Delhi. We diagnose and treat migraine and headache, epilepsy, stroke, Parkinson's disease, nerve and muscle disorders, back pain, memory problems and vertigo.
          </p>
          <p className="text-slate-600 mb-6">
            Our mission is simple: deliver accurate diagnosis and effective, personalised neurological care in a calm, welcoming environment where every patient is heard.
          </p>

          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              '24+ years of experience in neurology',
              'MBBS, MD (Medicine), DM (Neurology)',
              'Member: Indian & American Academy of Neurology',
              'Transparent consultation fee'
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 bg-brand-50/60 rounded-lg px-3.5 py-3 text-slate-700 text-sm"
              >
                <FiCheckCircle className="text-brand-600 mt-0.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="bg-brand-50/60 py-16">
        <div className="container-x">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-eyebrow mb-2">What Drives Us</p>
            <h2 className="text-3xl font-bold text-slate-900">
              Our Mission, Vision & <span className="text-brand-600">Values</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              [FiTarget, 'Our Mission', 'To make expert neurological care accessible, accurate and compassionate for every family in Delhi.'],
              [FiEye, 'Our Vision', 'To be the most trusted name in neurology care in South Delhi through clinical excellence and compassion.'],
              [FiHeart, 'Our Values', 'Integrity, evidence-based practice, patient comfort and continuous learning guide everything we do.']
            ].map(([Icon, title, desc]) => (
              <div
                key={title}
                className="group relative bg-white border border-slate-100 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/5"
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-brand-600 rounded-full transition-all duration-300 group-hover:w-10" />
                <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl mb-4 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <Icon />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}