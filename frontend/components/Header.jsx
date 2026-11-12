"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiPhone,
  FiPhoneCall,
  FiClock,
  FiUser,
  FiChevronDown,
  FiArrowRight,
  FiFacebook,
  FiInstagram,
  FiCalendar,
} from "react-icons/fi";
import { getPatientToken } from "@/lib/apiClient";
import { CLINIC, TREATMENT_LINKS } from "@/lib/clinic";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services", dropdown: "services" },
  { href: "/doctors", label: "Our Doctors" },
  { href: "/appointment", label: "Patient Care", dropdown: "care" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header({ settings = {} }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const phone = settings.phone || CLINIC.phone;
  const timing = settings.clinic_timing_text || CLINIC.timing;
  const logo =
    settings.logo_url ||
    "https://api.drneerajkumarneurologist.com/uploads/logo/logo.png";

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

  useEffect(() => {
    setMounted(true);
    setLoggedIn(!!getPatientToken());
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const careLinks = [
    { href: "/appointment", label: "Book Appointment" },
    mounted && loggedIn
      ? { href: "/profile", label: "My Dashboard" }
      : { href: "/login", label: "Patient Login" },
    { href: "/contact", label: "Contact Clinic" },
  ];

  const dropdownItems = (key) =>
    key === "services"
      ? [
          ...(TREATMENT_LINKS || []),
          { href: "/services", label: "View All Treatments", all: true },
        ]
      : careLinks;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_20px_rgba(11,42,91,0.08)]">
      {/* ===== Top utility bar ===== */}
      <div className="hidden bg-[#0B2A5B] text-xs text-white md:block">
        <div className="container-x flex items-center justify-between py-2">
          <a
            href={`tel:+91${phone}`}
            className="flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <FiPhoneCall size={13} className="text-sky-300" />
            <span>
              Call Us: <strong className="font-semibold">+91 {phone}</strong>
            </span>
          </a>

          <span className="flex items-center gap-2 text-white/80">
            <FiClock size={13} className="text-sky-300" />
            {timing}
          </span>

          <div className="flex items-center gap-3">
            {[
              { href: facebook, label: "Facebook", Icon: FiFacebook },
              { href: instagram, label: "Instagram", Icon: FiInstagram },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/70 transition-colors hover:text-sky-300"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Main nav ===== */}
      <div className="container-x flex items-center justify-between gap-6 py-2.5">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Neurocare Clinic home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Neurocare Clinic — Dr Neeraj Kumar, Senior Consultant Neurologist"
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            const base =
              "relative flex items-center gap-1 px-3.5 py-2 text-[13.5px] font-semibold transition-colors";
            const color = active
              ? "text-[#2F6FC6]"
              : "text-slate-700 hover:text-[#2F6FC6]";
            const underline = (
              <span
                className={`absolute -bottom-0.5 left-3.5 right-3.5 h-[2.5px] rounded-full bg-[#2F6FC6] transition-transform duration-300 ${
                  active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            );

            if (!link.dropdown) {
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`group ${base} ${color}`}
                >
                  {link.label}
                  {underline}
                </Link>
              );
            }

            return (
              <div key={link.label} className="group relative">
                <Link href={link.href} className={`${base} ${color}`}>
                  {link.label}
                  <FiChevronDown
                    size={14}
                    className="transition-transform duration-300 group-hover:rotate-180"
                  />
                  {underline}
                </Link>

                <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-2xl shadow-[#0B2A5B]/15">
                    {dropdownItems(link.dropdown).map((item) => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                          item.all
                            ? "mt-1 bg-[#2F6FC6]/10 font-bold text-[#2F6FC6] hover:bg-[#2F6FC6] hover:text-white"
                            : "text-slate-700 hover:bg-[#F2F7FF] hover:text-[#2F6FC6]"
                        }`}
                      >
                        {item.label}
                        {item.all && <FiArrowRight size={14} />}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/appointment"
            className="group inline-flex items-center gap-2 rounded-full bg-[#0B2A5B] px-6 py-3 text-[13px] font-bold text-white shadow-lg shadow-[#0B2A5B]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2F6FC6]"
          >
            Book Appointment
            <FiArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={`tel:+91${phone}`}
            aria-label="Call clinic"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#2F6FC6]/10 text-[#2F6FC6]"
          >
            <FiPhone size={17} />
          </a>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-[#0B2A5B] text-xl text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* ===== Mobile menu ===== */}
      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-blue-100 bg-white lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) =>
              link.dropdown ? (
                <details key={link.label} className="group">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden ${
                      isActive(link.href)
                        ? "bg-[#F2F7FF] text-[#2F6FC6]"
                        : "text-slate-800"
                    }`}
                  >
                    {link.label}
                    <FiChevronDown
                      size={16}
                      className="transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <div className="ml-3 mt-1 flex flex-col border-l-2 border-blue-100 pl-3">
                    {dropdownItems(link.dropdown).map((item) => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-600 hover:text-[#2F6FC6]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                    isActive(link.href)
                      ? "bg-[#F2F7FF] text-[#2F6FC6]"
                      : "text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}

            <div className="my-2 h-px bg-blue-100" />

            {mounted && loggedIn ? (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#0B2A5B]"
              >
                <FiUser size={16} /> Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#0B2A5B]"
              >
                <FiUser size={16} /> Patient Login
              </Link>
            )}

            <Link
              href="/appointment"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#0B2A5B] px-6 py-3.5 text-sm font-bold text-white"
            >
              <FiCalendar size={16} /> Book Appointment
            </Link>
            <a
              href={`tel:+91${phone}`}
              className="mt-2 flex items-center justify-center gap-2 rounded-full border-2 border-[#2F6FC6] px-6 py-3 text-sm font-bold text-[#2F6FC6]"
            >
              <FiPhoneCall size={16} /> Call Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}