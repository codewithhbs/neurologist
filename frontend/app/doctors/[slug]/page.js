import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiStar,
  FiCalendar,
  FiAward,
  FiClock,
  FiArrowRight,
  FiMapPin,
  FiCheckCircle,
  FiShield,
  FiUsers,
  FiBookOpen,
  FiHeart,
  FiActivity,
} from "react-icons/fi";
import { FaBrain, FaHeartbeat, FaRegLightbulb } from "react-icons/fa";

import { getDoctorBySlug, getDoctors } from "@/lib/api";
import TestimonialCard from "@/components/TestimonialCard";
import JsonLd from "@/components/JsonLd";
import { doctorSchema, breadcrumbSchema, SITE_URL } from "@/lib/schema";

export const revalidate = 300;

/* -------------------------------------------------------
   STATIC ROUTES & SEO
------------------------------------------------------- */

export async function generateStaticParams() {
  const res = await getDoctors();

  return (res?.doctors || []).map((doctor) => ({
    slug: doctor.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getDoctorBySlug(slug);
  const doctor = res?.doctor;

  if (!doctor) {
    return { title: "Doctor Not Found" };
  }

  return {
    title: doctor.meta_title || `${doctor.name} — ${doctor.specialization}`,
    description: doctor.meta_description || doctor.bio?.slice(0, 155),
    alternates: {
      canonical: `${SITE_URL}/doctors/${doctor.slug}`,
    },
    openGraph: {
      title: doctor.meta_title || doctor.name,
      description: doctor.meta_description || doctor.bio?.slice(0, 155),
      images: doctor.photo_url ? [doctor.photo_url] : [],
    },
  };
}

/* -------------------------------------------------------
   SERVICE PHOTOGRAPHY

   Uses an image supplied by your API first, then a local
   service image, and finally a relevant remote photograph.

   For the best performance, save your selected images in
   public/images/neurology-services/ and use local paths.
------------------------------------------------------- */

const DEFAULT_CONDITIONS = [
  "Migraine and headache disorders",
  "Epilepsy and seizure disorders",
  "Parkinson’s disease",
  "Stroke and neurological conditions",
  "Memory and cognitive disorders",
  "Spine and nerve disorders",
];

const TRUST_ITEMS = [
  {
    icon: FiAward,
    value: "24+",
    label: "Years of experience",
  },
  {
    icon: FiStar,
    value: "5.0",
    label: "Google rating",
  },
  {
    icon: FaBrain,
    value: "DM",
    label: "Neurology",
  },
  {
    icon: FiUsers,
    value: "IAN & AAN",
    label: "Professional memberships",
  },
];

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// API already returns full URLs; this only covers a leftover relative path.
function getServiceImage(service) {
  console.log(service);
  const url = service.banner_image_url || service.icon_url;
  if (typeof url !== "string" || !url.trim()) return null;
  const v = url.trim();
  return /^https?:\/\//i.test(v) ? v : `${API_URL}/${v.replace(/^\/+/, "")}`;
}
/* -------------------------------------------------------
   SMALL REUSABLE COMPONENTS
------------------------------------------------------- */

function SectionLabel({ children }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
        <FaBrain className="h-3.5 w-3.5" />
      </span>

      <span className="text-xs font-extrabold uppercase tracking-[0.17em] text-teal-600">
        {children}
      </span>
    </div>
  );
}

function DoctorPortrait({ doctor }) {
  const photo = doctor.photo_url;

  return (
    <div className="group relative mx-auto h-[310px] w-full max-w-[300px] overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-br from-sky-100 via-blue-50 to-teal-50 shadow-[0_20px_55px_rgba(15,74,140,0.18)] sm:h-[370px] lg:h-[405px] lg:max-w-none">
      {photo ? (
        <Image
          src={photo}
          alt={`Dr. ${doctor.name}, ${doctor.specialization}`}
          fill
          priority
          sizes="(max-width: 768px) 90vw, 300px"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.035]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-700">
          <FaBrain className="h-20 w-20 opacity-30" />
          <span className="mt-4 text-xl font-bold">{doctor.name}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/85 via-blue-950/35 to-transparent p-5 pt-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/95 px-3.5 py-2 text-xs font-bold text-brand-900 shadow-lg">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white">
            <FiAward className="h-4 w-4" />
          </span>
          Senior Consultant Neurologist
        </span>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm">
        <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {doctor.rating || "Neurology"}
      </div>
    </div>
  );
}

function CredentialCard({ icon: Icon, title, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-sky-100 bg-white/90 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-cyan-100 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-extrabold text-brand-900">{title}</p>
        <div className="mt-1 text-xs leading-5 text-slate-500">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   DOCTOR HERO
------------------------------------------------------- */

function DoctorHero({ doctor }) {
  const shortName = doctor.name?.replace(/^Dr\.?\s*/i, "") || "Doctor";

  const firstName = shortName.split(" ")[0];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#e9f6ff] via-white to-[#e5fbfa]">
      {/* Decorative medical artwork */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full border-[65px] border-sky-100/40"
      />

      <FaBrain
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-16 hidden text-[250px] text-blue-300/[0.10] xl:block"
      />

      <div className="container-x relative mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20">
        {/* Breadcrumbs */}

        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm"
        >
          <Link href="/" className="transition-colors hover:text-brand-600">
            Home
          </Link>

          <FiArrowRight className="h-3.5 w-3.5 text-slate-400" />

          <Link
            href="/doctors"
            className="transition-colors hover:text-brand-600"
          >
            Doctors
          </Link>

          <FiArrowRight className="h-3.5 w-3.5 text-slate-400" />

          <span className="font-bold text-brand-800">{doctor.name}</span>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[300px_minmax(0,1fr)_230px] lg:gap-10">
          {/* Portrait */}

          <DoctorPortrait doctor={doctor} />

          {/* Main profile information */}

          <div className="relative z-10 min-w-0">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-brand-800">
              <FaBrain className="h-4 w-4 text-teal-600" />
              Senior Consultant Neurologist
            </span>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl lg:text-5xl">
              {doctor.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-brand-700 sm:text-base">
              {doctor.qualification ||
                "MBBS, MD (General Medicine), DM (Neurology)"}
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Expert neurological care with a patient-first approach, careful
              evaluation and personalised treatment for brain, nerve and spine
              conditions.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {doctor.rating && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <FiStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-brand-900">
                    {doctor.rating}
                  </span>
                  <span className="text-slate-500">Rating</span>
                </div>
              )}

              {doctor.experience_years != null && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <FiAward className="h-4 w-4 text-teal-600" />
                  <span className="font-bold text-brand-900">
                    {doctor.experience_years}+ years
                  </span>
                  <span className="text-slate-500">experience</span>
                </div>
              )}

              {doctor.consultation_fee != null &&
                doctor.consultation_fee !== "" && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white/90 px-4 py-2 text-sm shadow-sm">
                    <FiCalendar className="h-4 w-4 text-teal-600" />
                    <span className="font-bold text-brand-900">
                      ₹{doctor.consultation_fee}
                    </span>
                    <span className="text-slate-500">consultation</span>
                  </div>
                )}
            </div>

            <Link
              href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-700 via-brand-600 to-cyan-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(37,99,235,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
            >
              <FiCalendar className="h-5 w-5" />
              Book Appointment with {firstName}
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Editorial tagline */}

          <div className="relative hidden min-w-0 flex-col items-center justify-center text-center lg:flex">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white bg-white/80 text-brand-600 shadow-lg shadow-blue-100/60">
              <FaBrain className="h-10 w-10" />
            </div>

            <p className="mt-5 font-serif text-xl italic leading-8 text-brand-800">
              Better Brain Health
              <br />
              for a Brighter Tomorrow
            </p>

            <span className="mt-3 h-1 w-12 rounded-full bg-teal-500" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   ABOUT & CLINIC DETAILS
------------------------------------------------------- */

function DoctorAbout({ doctor }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
      <div>
        <SectionLabel>Doctor Profile</SectionLabel>

        <h2 className="text-2xl font-extrabold leading-tight text-brand-950 sm:text-3xl">
          About {doctor.name}
        </h2>

        <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
          {doctor.bio ||
            `${doctor.name} provides neurological evaluation and personalised care for disorders affecting the brain, nerves, muscles and spine.`}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-brand-800">
            <FiShield className="h-4 w-4 text-teal-600" />
            Evidence-informed care
          </span>

          <span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-brand-800">
            <FiHeart className="h-4 w-4 text-teal-600" />
            Patient-first approach
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <CredentialCard icon={FiBookOpen} title="Qualifications">
          {doctor.qualification || "MBBS, MD, DM (Neurology)"}
        </CredentialCard>

        <CredentialCard icon={FiUsers} title="Professional Membership">
          {doctor.membership || "Indian & American Academy of Neurology"}
        </CredentialCard>

        <CredentialCard icon={FiAward} title="Clinical Experience">
          {doctor.experience_years != null
            ? `${doctor.experience_years}+ years of experience`
            : "Experienced neurological care"}
        </CredentialCard>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   IMAGE-LED SERVICE CARDS
------------------------------------------------------- */

function ServiceCard({ service }) {
  const imageSrc = getServiceImage(service);
  console.log(imageSrc);
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-sky-100 bg-white shadow-[0_5px_22px_rgba(37,99,235,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)]"
    >
      {/* Image from API (banner_image_url, then icon_url) */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 sm:h-48">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl text-brand-500/50">
            <FaBrain aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />

        <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
          <FiClock className="h-3.5 w-3.5 text-teal-600" />
          {service.duration_minutes
            ? `${service.duration_minutes} min`
            : "Consultation"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-extrabold leading-snug text-brand-950 transition-colors group-hover:text-blue-600">
          {service.name}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
          {service.short_description ||
            service.description ||
            `Professional evaluation and personalised care for ${service.name.toLowerCase()}.`}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-extrabold text-brand-600">
            Explore treatment
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-brand-600 transition-all group-hover:bg-brand-600 group-hover:text-white">
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
/* -------------------------------------------------------
   WHY CHOOSE THIS SPECIALIST
------------------------------------------------------- */

function WhyChooseDoctor({ doctor, clinics }) {
  const reasons = [
    `${doctor.experience_years || "Experienced"}${doctor.experience_years != null ? "+ years of experience" : " neurological care"}`,
    "Detailed neurological evaluation",
    "Personalised treatment planning",
    "Clear communication and guidance",
    "Patient-centred clinical care",
  ];

  return (
    <div className="space-y-5 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-700 via-brand-600 to-teal-500 p-6 text-white shadow-[0_15px_40px_rgba(37,99,235,0.18)] sm:p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
          <FiMapPin className="h-6 w-6" />
        </span>

        <h3 className="mt-5 text-xl font-extrabold">Available At</h3>

        {clinics.length > 0 ? (
          clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="mt-5 border-b border-white/20 pb-4 last:border-0 last:pb-0"
            >
              <p className="font-bold">{clinic.name}</p>

              <p className="mt-2 text-sm leading-6 text-white/80">
                {clinic.address}
              </p>
            </div>
          ))
        ) : (
          <p className="mt-4 text-sm leading-6 text-white/80">
            Contact the clinic for location and appointment details.
          </p>
        )}

        <Link
          href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
          className="mt-6 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-700 transition-colors hover:bg-sky-50"
        >
          <span className="flex items-center gap-2">
            <FiCalendar className="h-5 w-5" />
            Book Appointment
          </span>

          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-[24px] border border-teal-100 bg-gradient-to-br from-teal-50 to-sky-50 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
            <FiHeart className="h-5 w-5" />
          </span>

          <h3 className="text-lg font-extrabold text-brand-950">
            Why Choose {doctor.name}?
          </h3>
        </div>

        <ul className="mt-5 space-y-3">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2.5 text-sm leading-6 text-slate-600"
            >
              <FiCheckCircle className="mt-1 h-4 w-4 shrink-0 text-teal-600" />
              {reason}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl bg-white/80 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
              <FaRegLightbulb className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-extrabold text-brand-900">
                Your neurological health matters
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Get guidance for your next step in care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   TRUST BAR
------------------------------------------------------- */

function TrustBar({ doctor }) {
  const stats = TRUST_ITEMS.map((item) => {
    if (item.value === "24+") {
      return {
        ...item,
        value:
          doctor.experience_years != null
            ? `${doctor.experience_years}+`
            : "Expert",
      };
    }

    if (item.value === "5.0") {
      return {
        ...item,
        value: doctor.rating || "5.0",
      };
    }

    return item;
  });

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-sky-100 bg-white/90 shadow-sm md:grid-cols-4">
      {stats.map(({ icon: Icon, value, label }, index) => (
        <div
          key={label}
          className={`flex items-center justify-center gap-3 px-3 py-5 sm:px-5 sm:py-6 ${
            index < 2 ? "border-b border-sky-100 md:border-b-0" : ""
          } ${index % 2 === 0 ? "border-r border-sky-100" : ""} ${
            index === 1 ? "md:border-r" : ""
          } ${index === 2 ? "md:border-r md:border-sky-100" : ""}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-teal-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-brand-900 sm:text-xl">
              {value}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------
   MAIN DOCTOR DETAIL PAGE
------------------------------------------------------- */

export default async function DoctorDetailPage({ params }) {
  const { slug } = await params;
  const res = await getDoctorBySlug(slug);

  if (!res?.doctor) notFound();

  const { doctor, clinics = [], services = [], reviews = [] } = res;

  const conditions =
    doctor.conditions?.length > 0 ? doctor.conditions : DEFAULT_CONDITIONS;

  return (
    <>
      <JsonLd data={doctorSchema(doctor)} />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Doctors", path: "/doctors" },
          {
            name: doctor.name,
            path: `/doctors/${doctor.slug}`,
          },
        ])}
      />

      <main className="overflow-hidden bg-gradient-to-b from-white via-white to-sky-50/50">
        {/* Hero */}

        <DoctorHero doctor={doctor} />

        {/* Trust bar */}

        <section className="container-x relative z-10 mx-auto -mt-5 max-w-7xl px-4 sm:-mt-7 sm:px-6 lg:px-8">
          <TrustBar doctor={doctor} />
        </section>

        {/* Doctor introduction and sidebar */}

        <section className="container-x mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-14">
            <div className="min-w-0 space-y-14 sm:space-y-16">
              <DoctorAbout doctor={doctor} />

              {/* Areas of expertise */}

              {services.length > 0 && (
                <section id="services">
                  <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <SectionLabel>Specialist Services</SectionLabel>

                      <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-brand-950 sm:text-3xl lg:text-4xl">
                        Advanced Neurological Care
                        <span className="block text-brand-600">
                          for a Healthier You
                        </span>
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                        Comprehensive assessment and personalised treatment for
                        neurological and spine conditions.
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                      <FiActivity className="h-4 w-4" />
                      {services.length} services
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              )}

              {/* Conditions */}

              <section>
                <SectionLabel>Conditions We Address</SectionLabel>

                <h2 className="text-2xl font-extrabold text-brand-950 sm:text-3xl">
                  Care for Brain, Nerve & Spine Health
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Neurological conditions can affect everyday activities in
                  different ways. Assessment helps identify suitable care and
                  treatment options.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {conditions.map((condition) => (
                    <div
                      key={condition}
                      className="flex items-start gap-3 rounded-xl border border-sky-100 bg-white p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <FiCheckCircle className="h-4 w-4" />
                      </span>

                      <span className="pt-1 text-sm font-semibold leading-5 text-slate-700">
                        {condition}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Testimonials */}

              {reviews.length > 0 && (
                <section>
                  <SectionLabel>Patient Experiences</SectionLabel>

                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <h2 className="text-2xl font-extrabold text-brand-950 sm:text-3xl">
                        Patient Reviews
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Read feedback shared by patients about their
                        experiences.
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                      <FiStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                      Patient feedback
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {reviews.map((review) => (
                      <TestimonialCard key={review.id} review={review} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky sidebar */}

            <aside className="min-w-0">
              <WhyChooseDoctor doctor={doctor} clinics={clinics} />
            </aside>
          </div>
        </section>

        {/* Final call to action */}

        <section className="container-x mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-950 via-blue-800 to-teal-600 px-6 py-9 text-white shadow-[0_20px_55px_rgba(15,74,140,0.18)] sm:px-10 sm:py-12 lg:px-14">
            <FaBrain
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-12 -z-10 text-[230px] text-white/[0.07]"
            />

            <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]">
                  <FaHeartbeat className="h-3.5 w-3.5" />
                  Your health comes first
                </span>

                <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                  Take the Next Step Towards Better Neurological Health
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                  Connect with {doctor.name} to discuss your concerns and
                  explore appropriate care options.
                </p>
              </div>

              <Link
                href={`/appointment?doctor=${encodeURIComponent(doctor.slug)}`}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-brand-800 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-sky-50"
              >
                <FiCalendar className="h-5 w-5" />
                Book an Appointment
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
