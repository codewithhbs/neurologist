import Link from "next/link";
import {
  FiCheckCircle,
  FiPhoneCall,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiMapPin,
  FiStar,
  FiAward,
  FiActivity,
  FiShield,
  FiHeart,
  FiClock,
  FiUserCheck,
  FiTrendingUp,
  FiPlus,
  FiHelpCircle,
} from "react-icons/fi";

import { FaBrain } from "react-icons/fa";
import {
  getServices,
  getDoctors,
  getReviews,
  getSettings,
  getHeroBanners,
} from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { CLINIC } from "@/lib/clinic";
import FeatureStrip from "@/components/FeatureStrip";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import Testimonials from "@/components/Testimonials";
import WhyChooseUs from "@/components/WhyChooseUs";
import MeetOurTeam from "@/components/MeetOurTeam";

export const revalidate = 120;

const hasImage = (b) =>
  typeof b?.image_url === "string" && b.image_url.trim() !== "";

/* FAQ content — edit here */
const FAQS = [
  {
    q: "When should I consult a neurologist?",
    a: "Consult a neurologist for persistent headaches or migraine, seizures, dizziness, numbness or tingling, weakness, tremors, memory problems, or chronic back and nerve pain. Early evaluation leads to better outcomes.",
  },
  {
    q: "What tests are done at a neurology clinic?",
    a: "Depending on your symptoms, your doctor may advise a detailed neurological examination along with tests such as MRI, CT scan, EEG, EMG/NCV, or blood tests. Only the tests you actually need are recommended.",
  },
  {
    q: "Is treatment for neurological disorders permanent?",
    a: "It depends on the condition. Some disorders can be fully treated, while others like epilepsy, migraine or Parkinson's are managed long-term with medication and lifestyle changes, allowing most patients to lead a normal life.",
  },
  {
    q: "Do you offer emergency services?",
    a: "The clinic runs scheduled consultations. For sudden weakness, face drooping, slurred speech or a prolonged seizure, go to the nearest hospital emergency immediately — do not wait for an appointment.",
  },
  {
    q: "How do I book an appointment?",
    a: "Use the Book Appointment button on this page or call the clinic directly. Consultation hours are Monday to Saturday, 6:00–8:00 PM.",
  },
];

function Eyebrow({ children, light = false }) {
  return (
    <p
      className={`mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${
        light ? "text-white/60" : "text-accent-600"
      }`}
    >
      <span className={`h-px w-6 ${light ? "bg-white/40" : "bg-accent-500"}`} />
      {children}
    </p>
  );
}

function OutlineLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:text-brand-700 active:scale-[0.99]"
    >
      {children} <FiArrowRight size={15} />
    </Link>
  );
}

/* Branded hero shown when no banner images are configured in the admin panel */
function BrandHero({ phone }) {
  return (
    <section className="relative overflow-hidden bg-brand-gradient text-white">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-leaf-500/25 blur-3xl" />
      <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent-400/30 blur-3xl" />
      <FaBrain
        className="absolute -right-10 top-1/2 hidden -translate-y-1/2 text-[360px] text-white/[0.08] lg:block"
        aria-hidden="true"
      />

      <div className="container-x relative grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            <FaBrain /> Senior Consultant Neurologist · Vasant Kunj, New Delhi
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Expert Neurology Care for{" "}
            <span className="text-leaf-300">Brain, Nerve &amp; Spine</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Consult Dr Neeraj Kumar for migraine, epilepsy, stroke,
            Parkinson&apos;s disease, nerve disorders, back pain, memory
            problems and dizziness — with 24+ years of experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/appointment"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5"
            >
              <FiCalendar /> Book Appointment
            </Link>
            <a
              href={`tel:+91${phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiPhoneCall /> Call Now
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FiStar className="text-amber-300" /> 5.0 Google rating
            </span>
            <span className="flex items-center gap-2">
              <FiClock /> Mon–Sat, 6:00–8:00 PM
            </span>
            <span className="flex items-center gap-2">
              <FiMapPin /> Vasant Kunj, New Delhi
            </span>
          </div>
        </div>

        <div className="hidden lg:flex justify-center">
          <div className="relative rounded-3xl bg-white p-8 shadow-2xl shadow-brand-900/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.png"
              alt="Neurocare Clinic"
              className="h-64 w-64 object-contain"
            />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-500 px-5 py-2 text-xs font-bold text-white shadow-lg">
              Dr Neeraj Kumar · DM Neurology
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FAQ + image */
function FaqSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F2F7FF] py-14 sm:py-16 lg:py-20">
      <div className="container-x relative grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        {/* LEFT: FAQ */}
        <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur sm:p-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2F6FC6]/10 text-[#2F6FC6]">
              <FiHelpCircle size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F6FC6]">
              FAQ
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find answers to common questions about neurology care.
          </p>

          <div className="mt-6 space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group rounded-xl border border-blue-100 bg-[#F5F9FF] transition-colors open:border-[#2F6FC6]/40 open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <FiCheckCircle className="shrink-0 text-[#2F6FC6]" size={16} />
                    {f.q}
                  </span>
                  <FiPlus
                    size={18}
                    className="shrink-0 text-slate-500 transition-transform duration-300 group-open:rotate-45 group-open:text-[#2F6FC6]"
                  />
                </summary>
                <p className="px-4 pb-4 pl-11 text-sm leading-7 text-slate-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="relative overflow-hidden rounded-3xl bg-[#EAF2FF] shadow-2xl shadow-[#0B2A5B]/15 ring-1 ring-blue-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/faq.png"
            alt="Dr Neeraj Kumar - Neurology Care FAQ"
            loading="lazy"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [servicesRes, doctorsRes, reviewsRes, settingsRes, bannersRes] =
    await Promise.all([
      getServices(),
      getDoctors(),
      getReviews("?featured=1"),
      getSettings(),
      getHeroBanners(),
    ]);

  const services = (servicesRes?.services || [])
    .filter((s) => s.is_featured)
    .slice(0, 8);
  const doctors = (doctorsRes?.doctors || []).slice(0, 4);
  const reviews = reviewsRes?.reviews || [];
  const settings = settingsRes?.settings || {};
  const banners = (bannersRes?.banners || []).filter(hasImage);
  const desktopBanners = banners.filter((b) => !b.is_mobile);
  const mobileBanners = banners.filter((b) => b.is_mobile);
  const phone = settings.phone || CLINIC.phone;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      <JsonLd data={faqSchema} />

      {/* HERO */}
      {banners.length > 0 ? (
        <>
          <HeroBannerSlider
            banners={desktopBanners.length ? desktopBanners : banners}
            className="hidden md:block"
          />
          <HeroBannerSlider
            banners={mobileBanners.length ? mobileBanners : banners}
            className="block md:hidden "
          />
        </>
      ) : (
        <BrandHero phone={phone} />
      )}

      <div className="flex flex-col">
        {/* Feature strip */}
        <div className="order-2 mx-auto w-full md:order-1">
          <FeatureStrip />
        </div>

        <section className="order-3 md:order-2 relative overflow-hidden bg-white">
          <div className="container-x relative grid items-center gap-14 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-emerald-50/70 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-50/50 blur-3xl" />

            {/* LEFT: Clinic Image */}
            <div className="relative z-10 mx-auto w-full max-w-[650px]">
              {/* Green decorative frame */}
              <div className="absolute -left-3 -top-3 h-full w-[95%] rounded-[2rem] bg-[#2F6FC6] sm:-left-5 sm:-top-5" />

              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-[5px] border-white bg-slate-100 shadow-2xl shadow-slate-900/10">
                <img
                  src="/about.png"
                  alt="Neurocare Clinic - Dr Neeraj Kumar"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
              </div>

              {/* Experience Badge */}
              <div className="absolute -bottom-7 left-3 flex items-center gap-4 rounded-3xl bg-white px-5 py-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-100 sm:-left-5 sm:px-7 sm:py-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[#2F6FC6]">
                  <FiAward size={30} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">
                    24+ Years
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    of Neurology Expertise
                  </p>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute -left-12 top-20 -z-10 hidden grid-cols-4 gap-4 sm:grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-[#2F6FC6]/70"
                  />
                ))}
              </div>
            </div>

            {/* RIGHT: Content */}
            <div className="relative z-10 pt-8 lg:pt-0">
              {/* Eyebrow */}
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#2F6FC6]" />
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#2F6FC6]">
                  Our Clinic
                </span>
                <span className="h-px w-10 bg-[#2F6FC6]" />
              </div>

              <h2 className="max-w-2xl text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                Advanced Neurology Care You Can{" "}
                <span className="relative inline-block text-[#2F6FC6]">
                  Trust
                  <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-[#2F6FC6]/70" />
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600">
                At Neurocare Clinic, Dr.{" "}
                <strong className="font-semibold text-slate-900">
                  Neeraj Kumar
                </strong>{" "}
                offers expert diagnosis and personalised treatment for a wide
                range of neurological disorders, with a commitment to your
                better health.
              </p>

              {/* Feature Pills */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { icon: FiActivity, label: "Expert Neurologist" },
                  { icon: FiShield, label: "Accurate Diagnosis" },
                  { icon: FiHeart, label: "Patient-Centric Care" },
                  { icon: FiClock, label: "Modern Facilities" },
                  { icon: FiUserCheck, label: "Compassionate Support" },
                  { icon: FiTrendingUp, label: "Proven Results" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#2F6FC6] shadow-sm">
                      <Icon size={22} />
                    </span>
                    <span className="text-[12px] font-semibold leading-snug text-slate-800 sm:text-[13px]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/booking"
                  className="group inline-flex items-center gap-4 rounded-full bg-[#2F6FC6] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#2F6FC6]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2F6FC6] hover:shadow-xl"
                >
                  Book an Appointment
                  <FiArrowRight
                    size={20}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services / Treatments Section */}
        <section className="order-1 relative isolate overflow-hidden bg-gradient-to-b from-[#F2F7FF] via-white to-[#F5F9FF] py-14 sm:py-16 md:order-3 lg:py-20">
          {/* Background decorations */}
          <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[450px] w-[450px] rounded-full bg-[#2F6FC6]/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 -z-10 h-[400px] w-[400px] rounded-full bg-blue-100/60 blur-3xl" />

          <div className="container-x relative">
            {/* Section Heading */}
            <div className="mb-8 flex flex-col gap-5 sm:mb-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-[2px] w-8 rounded-full bg-[#2F6FC6]" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F6FC6]">
                    Our Treatments
                  </span>
                  <span className="h-[2px] w-8 rounded-full bg-[#2F6FC6]" />
                </div>

                <h2 className="max-w-xl text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                  Complete neurology care for{" "}
                  <span className="text-[#2F6FC6]">every patient</span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  From headaches and memory issues to complex neurological
                  disorders, we offer advanced and personalised treatment for
                  your better health.
                </p>
              </div>

              {/* Desktop CTA */}
              <div className="hidden shrink-0 md:block">
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#2F6FC6] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#2F6FC6]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#245BA5] hover:shadow-xl"
                >
                  View All Treatments
                  <FiArrowRight
                    size={19}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>

            {/* Treatment Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="mt-8 text-center md:hidden">
              <Link
                href="/services"
                className="inline-flex items-center gap-3 rounded-full bg-[#2F6FC6] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2F6FC6]/20 transition-all hover:bg-[#245BA5]"
              >
                View All Treatments
                <FiArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Why choose us */}
      <WhyChooseUs />

      {/* Doctor */}
      <MeetOurTeam doctors={doctors} />

      {/* Testimonials */}
      {reviews.length > 0 && <Testimonials reviews={reviews} />}

      {/* FAQ */}
      <FaqSection />
    </>
  );
}