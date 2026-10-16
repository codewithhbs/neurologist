"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiPhone, FiMail, FiUser, FiMapPin } from "react-icons/fi";
import { getPatientToken, clearPatientToken } from "@/lib/apiClient";
import { CLINIC } from "@/lib/clinic";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Treatments" },
  { href: "/doctors", label: "Doctor" },
  { href: "/blog", label: "Blog" },
  // { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header({ settings = {} }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const phone = settings.phone || CLINIC.phone;
  const email = settings.email || CLINIC.email;
  const address = settings.address || CLINIC.address;
  const logo = settings.logo_url || "/logo.png";

  useEffect(() => {
    setMounted(true);
    setLoggedIn(!!getPatientToken());
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      {/* Top utility bar */}
      <div className="hidden md:block bg-brand-900 text-white text-xs">
        <div className="container-x flex items-center justify-between py-2">
          <span className="flex items-center gap-1.5 truncate text-white/80">
            <FiMapPin size={13} className="text-accent-300 shrink-0" />
            {address}
          </span>
          <div className="flex items-center gap-5 shrink-0">
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <FiMail size={13} className="text-accent-300" /> {email}
            </a>
            <a
              href={`tel:+91${phone}`}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <FiPhone size={13} className="text-accent-300" /> {phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container-x flex items-center justify-between py-2.5">
        <Link href="/" className="flex items-center shrink-0" aria-label="Neurocare Clinic home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Neurocare Clinic — Dr Neeraj Kumar, Senior Consultant Neurologist"
            className="h-12 sm:h-14 w-auto"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-slate-700 hover:text-brand-700 font-medium text-sm transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-accent-500 after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {mounted && loggedIn ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-medium text-brand-800 border border-brand-200 rounded-full px-4 py-2 hover:bg-brand-50 transition-colors"
            >
              <FiUser size={15} /> Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-brand-800 border border-brand-200 rounded-full px-4 py-2 hover:bg-brand-50 transition-colors"
            >
              Patient Login
            </Link>
          )}
          <Link href="/appointment" className="btn-primary text-sm px-5 py-2.5">
            Book Appointment
          </Link>
        </div>

        <button
          className="lg:hidden text-2xl text-brand-800"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t bg-white">
          <div className="container-x py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-slate-700 font-medium py-1.5"
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-slate-100 my-1" />

            {mounted && loggedIn ? (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-brand-800 font-medium py-1.5"
              >
                <FiUser size={16} /> Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-brand-700 font-medium py-1.5"
              >
                Patient Login
              </Link>
            )}

            <Link
              href="/appointment"
              onClick={() => setOpen(false)}
              className="btn-primary w-full mt-2 text-center"
            >
              Book Appointment
            </Link>
            <a href={`tel:+91${phone}`} className="btn-outline w-full text-center">
              Call Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
