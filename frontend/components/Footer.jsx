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
      <section className="relative bg-brand-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-accent-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brand-500/25 blur-3xl" />
        <FaBrain className="hidden lg:block absolute bottom-4 right-24 text-[170px] text-white/[0.06]" aria-hidden="true" />

        <div className="container-x relative py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="section-eyebrow text-accent-300 mb-2">Get In Touch</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              Have a Question? We&apos;re Here to Help!
            </h2>
            <p className="text-brand-100/80 mb-6">
              Call us or WhatsApp us to book your consultation with Dr Neeraj Kumar.
            </p>

            <div className="flex items-start gap-3 border-t border-white/10 pt-5">
              <FiCalendar className="text-accent-300 mt-0.5 shrink-0" />
              <div className="text-sm text-brand-100/80 space-y-1">
                <p>
                  <strong className="text-white font-medium">Monday–Saturday:</strong>{" "}
                  6:00 PM–8:00 PM
                </p>
                <p>
                  <strong className="text-white font-medium">Sunday:</strong> Closed
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <a
              href={`tel:+91${phone}`}
              className="group flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3.5 rounded-xl text-center transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FiPhoneCall className="transition-transform group-hover:rotate-12" /> {phone}
            </a>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 font-semibold px-6 py-3.5 rounded-xl text-center transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FaWhatsapp /> Chat on WhatsApp
            </a>
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
