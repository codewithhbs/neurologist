import Link from "next/link";
import {
  FiCheckCircle,
  FiPhoneCall,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiClock,
  FiMapPin,
  FiStar,
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

const hasImage = (b) => typeof b?.image_url === "string" && b.image_url.trim() !== "";

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
            Consult Dr Neeraj Kumar for migraine, epilepsy, stroke, Parkinson&apos;s disease,
            nerve disorders, back pain, memory problems and dizziness — with 24+ years of
            experience.
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
            <img src="/logo-icon.png" alt="Neurocare Clinic" className="h-64 w-64 object-contain" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-500 px-5 py-2 text-xs font-bold text-white shadow-lg">
              Dr Neeraj Kumar · DM Neurology
            </div>
          </div>
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

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />

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

        {/* About */}
        <section className="order-3 md:order-2">
          <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
            <div className="relative">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-accent-50 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/about.png"
                  alt="Neurocare Clinic"
                  className="w-auto object-contain"
                />
              </div>

              {/* floating stat */}
              <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 sm:left-auto sm:-right-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
                  <FiUsers size={20} />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-none text-slate-900">24+ Years</p>
                  <p className="text-[11.5px] capitalize text-slate-500">of neurology experience</p>
                </div>
              </div>
            </div>

            <div className="pt-6 lg:pt-0">
              <Eyebrow>About Our Clinic</Eyebrow>
              <h2 className="text-3xl font-bold leading-tight tracking-tight capitalize text-slate-900 sm:text-[2rem]">
                Advanced neurology care you can{" "}
                <span className="text-brand-600">trust</span>
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                At Neurocare Clinic in Vasant Kunj, New Delhi, Dr Neeraj Kumar — Senior
                Consultant Neurologist — provides accurate diagnosis and personalised treatment
                for disorders of the brain, nerves, muscles and spine.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "MBBS, MD (Medicine), DM (Neurology)",
                  "Member: Indian & American Academy of Neurology",
                  "Detailed evaluation, clear explanation",
                  "Personalised treatment for every patient",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[13.5px] text-slate-700"
                  >
                    <FiCheckCircle size={16} className="mt-0.5 shrink-0 text-accent-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 capitalize">
                <OutlineLink href="/about">Know more about us</OutlineLink>
              </div>
            </div>
          </div>
        </section>

{/* Services - paste in place of your current section */}
<section className="order-1 bg-gradient-to-b from-brand-600/[0.05] to-transparent py-10 sm:py-12 md:order-3 lg:py-16">
  <div className="container-x">
    {/* heading + desktop link on one row */}
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Eyebrow>Our Treatments</Eyebrow>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 text-balance sm:text-3xl lg:text-4xl">
          Complete neurology care for every patient
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          From headache and epilepsy to Parkinson&apos;s disease and nerve disorders, we cover
          your neurological needs.
        </p>
      </div>

      <div className="hidden md:block">
        <OutlineLink href="/services">View all treatments</OutlineLink>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {services.map((s, i) => (
        <ServiceCard key={s.id} service={s} index={i} />
      ))}
    </div>

    {/* mobile link below the grid */}
    <div className="mt-6 text-center md:hidden">
      <OutlineLink href="/services">View all treatments</OutlineLink>
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
    </>
  );
}
