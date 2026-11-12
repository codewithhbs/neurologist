import Link from "next/link";
import {
  FiFacebook,
  FiInstagram,
  FiMapPin,
  FiPhone,
  FiPhoneCall,
  FiMail,
  FiCalendar,
  FiClock,
  FiShield,
  FiChevronRight,
  FiHome,
  FiUser,
  FiGrid,
  FiUsers,
  FiFileText,
  FiMessageCircle,
} from "react-icons/fi";
import { FaWhatsapp, FaBrain } from "react-icons/fa";
import { CLINIC, TREATMENT_LINKS } from "@/lib/clinic";

const QUICK_LINKS = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/about", label: "About Us", icon: FiUser },
  { href: "/services", label: "Treatments", icon: FiGrid },
  { href: "/doctors", label: "Doctor", icon: FiUsers },
  { href: "/blog", label: "Blog", icon: FiFileText },
  { href: "/contact", label: "Contact Us", icon: FiMessageCircle },
];

export default function Footer({ settings = {} }) {
  const phone = settings.phone || CLINIC.phone;
  const whatsapp = settings.whatsapp || CLINIC.whatsapp;
  const email = settings.email || CLINIC.email;
  const address = settings.address || CLINIC.address;
  const timing = settings.clinic_timing_text || `${CLINIC.timing} | ${CLINIC.timingNote}`;
  let social = {};
  try {
    social =
      typeof settings.social_links === "string"
        ? JSON.parse(settings.social_links)
        : settings.social_links || {};
  } catch {
    social = {};
  }
  const facebook = social.facebook || CLINIC.facebook;
  const instagram = social.instagram || CLINIC.instagram;
  const year = new Date().getFullYear();

  return (
    <>
      {/* ================= CTA STRIP ================= */}
      <section className="relative isolate overflow-hidden bg-[#0B2A5B] text-white">
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#2F6FC6]/40 blur-3xl" />
        <div className="absolute -bottom-40 right-0 -z-10 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <FaBrain
          aria-hidden="true"
          className="absolute -bottom-16 left-1/3 -z-10 hidden text-[320px] text-white/[0.04] lg:block"
        />

        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          {/* LEFT */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              Now booking consultations
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              Have a Question?
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-white bg-clip-text text-transparent">
                We&apos;re Here to Help!
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/75 sm:text-base">
              Call us or WhatsApp us to book your consultation with Dr Neeraj
              Kumar. We usually reply within minutes.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:+91${phone}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-4 text-[#133E82] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#2F6FC6] text-white">
                    <FiPhoneCall
                      size={20}
                      className="transition-transform duration-300 group-hover:rotate-12"
                    />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Call Now
                    </span>
                    <span className="text-lg font-extrabold">+91 {phone}</span>
                  </span>
                </span>
              </a>

              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-[#25D366] p-4 text-white shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1FBF5B]"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
                    <FaWhatsapp size={24} />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-white/80">
                      WhatsApp
                    </span>
                    <span className="text-lg font-extrabold">Chat With Us</span>
                  </span>
                </span>
              </a>
            </div>
          </div>

          {/* RIGHT: schedule card */}
          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-400/30 to-transparent blur-xl" />
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-sky-200">
                    <FiCalendar size={20} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold">Clinic Schedule</p>
                    <p className="text-xs text-white/60">
                      Dr Neeraj Kumar · Neurologist
                    </p>
                  </div>
                </div>
                <FiShield className="text-sky-300" size={20} />
              </div>

              {/* week strip */}
              <div className="mt-6 grid grid-cols-7 gap-2">
                {[
                  ["M", true],
                  ["T", true],
                  ["W", true],
                  ["T", true],
                  ["F", true],
                  ["S", true],
                  ["S", false],
                ].map(([d, open], i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-bold ${
                      open
                        ? "bg-white text-[#133E82] shadow-md"
                        : "border border-dashed border-white/25 text-white/40"
                    }`}
                  >
                    {d}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        open ? "bg-emerald-500" : "bg-white/30"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">
                    Monday – Saturday
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold">
                    <FiClock className="text-sky-300" size={20} />
                    6:00 – 8:00 PM
                  </p>
                </div>
                <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  Sunday closed
                </p>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
                <FiMapPin size={13} className="text-sky-300" />
                Vasant Kunj, New Delhi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN FOOTER ================= */}
      <footer className="relative bg-slate-50 text-slate-700 overflow-hidden">
        <div className="container-x relative py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + about */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo_url || "/logo.png"}
              alt="Neurocare Clinic"
              className="h-14 w-auto mb-4"
            />
            <p className="text-sm text-slate-500 mb-4">
              Expert neurology care for brain, nerve and spine conditions by Dr Neeraj Kumar,
              Senior Consultant Neurologist in Vasant Kunj, New Delhi.
            </p>
            <div className="flex gap-3 mb-6">
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors"
              >
                <FiFacebook />
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors"
              >
                <FiInstagram />
              </a>
            </div>

            {/* promo card */}
            <div className="rounded-2xl bg-white border border-slate-200 p-3 flex gap-3 items-center shadow-sm">
              <div className="w-16 h-16 rounded-xl shrink-0 bg-brand-gradient flex items-center justify-center text-white text-3xl">
                <FaBrain />
              </div>
              <div>
                <p className="text-slate-900 font-semibold text-sm leading-snug">
                  Healthy Mind, Healthy Life
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Book your consultation today.
                </p>
                <Link
                  href="/appointment"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Book Appointment <FiChevronRight />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-slate-900 font-semibold mb-4 pb-2 border-b-2 border-accent-500 inline-block">
              Quick Links
            </p>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 hover:text-brand-600 transition-colors"
                  >
                    <Icon className="text-accent-500 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Treatments */}
          <div>
            <p className="text-slate-900 font-semibold mb-4 pb-2 border-b-2 border-accent-500 inline-block">
              Our Treatments
            </p>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {TREATMENT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 hover:text-brand-600 transition-colors"
                  >
                    <FaBrain className="text-accent-500 shrink-0 text-xs" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <p className="text-slate-900 font-semibold mb-4 pb-2 border-b-2 border-accent-500 inline-block">
              Contact Info
            </p>
            <ul className="space-y-3 text-sm text-slate-500 mb-5">
              <li className="flex items-start gap-2.5">
                <FiMapPin className="mt-0.5 shrink-0 text-accent-500" /> {address}
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="text-accent-500" />
                <a href={`tel:+91${phone}`} className="hover:text-brand-600">
                  +91 {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FaWhatsapp className="text-accent-500" />
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600"
                >
                  WhatsApp us
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="text-accent-500" />
                <a href={`mailto:${email}`} className="hover:text-brand-600">
                  {email}
                </a>
              </li>
            </ul>

            <div className="rounded-2xl bg-brand-gradient text-white p-4 flex items-start gap-3">
              <FiClock className="mt-0.5 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold mb-1">We&apos;re Open</p>
                <p className="text-white/90">{timing}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 bg-brand-900 text-slate-300">
          <div className="container-x py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="flex items-center gap-2">
              <FiShield className="text-accent-300" /> Expert Care. Accurate Diagnosis. Better Living.
            </p>
            <p className="text-slate-400">
              © {year} Neurocare Clinic | Dr Neeraj Kumar. All Rights Reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}