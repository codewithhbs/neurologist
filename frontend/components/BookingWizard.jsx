"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Script from "next/script";
import {
  FiCheck,
  FiCalendar,
  FiClock,
  FiUser,
  FiCreditCard,
  FiCheckCircle,
  FiTag,
  FiArrowLeft,
  FiArrowRight,
  FiAlertCircle,
  FiPhone,
  FiChevronRight,
  FiChevronLeft,
  FiSunrise,
  FiSun,
  FiSunset,
  FiShield,
  FiMapPin,
  FiMessageCircle,
  FiLock,
  FiUsers,
  FiAward,
  FiStar,
  FiActivity,
  FiHome,
  FiInfo,
  FiHeadphones,
  FiThumbsUp,
  FiHeart,
  FiEdit3,
} from "react-icons/fi";
import apiClient, { setPatientToken, getPatientToken } from "@/lib/apiClient";
import FamilyMemberPicker from "@/components/FamilyMemberPicker";

const PRIMARY = "#0D5CA8";
const DARK = "#11417E";
const STEPS = ["Doctor", "Date & Time", "Review & Confirm"];
const APPT_KEY = "neurocare_booking_appt";

/* ================= helpers ================= */
const to12h = (t) => {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = +m[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
};

const hourOf = (t) => {
  const m = String(t).match(/^(\d{1,2}):/);
  return m ? +m[1] : 0;
};

const isoOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const todayIso = () => isoOf(new Date());

const nextDays = (n = 14) =>
  Array.from({ length: n }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: isoOf(d),
      dow: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      mon: d.toLocaleDateString("en-IN", { month: "short" }),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : null,
    };
  });

const prettyDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

function fmtRange([a, b]) {
  return `${to12h(a)} - ${to12h(b)}`;
}

function timingLines(timingJson) {
  if (!timingJson) return [];
  const lines = [];
  if (Array.isArray(timingJson.mon_sat) && timingJson.mon_sat.length) {
    lines.push({
      label: "Mon - Sat",
      value: timingJson.mon_sat.map(fmtRange).join(", "),
    });
  }
  if (Array.isArray(timingJson.sun) && timingJson.sun.length) {
    lines.push({
      label: "Sunday",
      value: timingJson.sun.map(fmtRange).join(", "),
    });
  }
  return lines;
}

/* pull every usable image out of whatever shape the API sends */
function collectImages(clinic) {
  if (!clinic) return [];
  const buckets = [
    clinic.gallery,
    clinic.images,
    clinic.gallery_json,
    clinic.banner_images,
  ];
  const out = [];
  for (let raw of buckets) {
    if (!raw) continue;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = [raw];
      }
    }
    if (!Array.isArray(raw)) continue;
    raw.forEach((it) => {
      const url =
        typeof it === "string" ? it : it?.url || it?.image_url || it?.src;
      if (url) out.push(url);
    });
  }
  if (clinic.image_url) out.unshift(clinic.image_url);
  return [...new Set(out.filter(Boolean))];
}

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImgWithFallback({ src, alt, className, fallback }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  if (!src || err) return fallback;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D5CA8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0D5CA8]/25 transition hover:bg-[#11417E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]";
const card =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50";

/* ================= sliding images ================= */
function Slider({
  slides,
  heightClass = "h-40",
  arrows = false,
  interval = 4200,
  rounded = "rounded-2xl",
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);

  if (!n) return null;

  const go = (d) => setI((p) => (p + d + n) % n);

  return (
    <div
      className={`group relative w-full overflow-hidden ${rounded} ${heightClass} bg-gradient-to-br from-[#11417E] via-[#0D5CA8] to-[#08A599]`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        startX.current = null;
        setPaused(false);
      }}
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s, idx) =>
          s.type === "image" ? (
            <div key={idx} className="h-full w-full shrink-0">
              <ImgWithFallback
                src={s.src}
                alt={s.alt || "Clinic"}
                className="h-full w-full object-cover"
                fallback={
                  <div className="grid h-full w-full place-items-center text-4xl text-white/80">
                    🧠
                  </div>
                }
              />
              {s.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-4 pb-5 pt-8">
                  <p className="text-[12.5px] font-semibold text-white">
                    {s.caption}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              key={idx}
              className="relative flex h-full w-full shrink-0 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#11417E] via-[#0D5CA8] to-[#08A599] px-5"
            >
              <span className="pointer-events-none absolute -right-6 -top-8 text-[110px] leading-none opacity-20">
                🧠
              </span>
              <p className="relative text-[19px] font-extrabold leading-tight text-white">
                {s.title}
              </p>
              {s.accent && (
                <p className="relative text-[19px] font-extrabold leading-tight text-accent-300">
                  {s.accent}
                </p>
              )}
              {s.sub && (
                <p className="relative mt-2 max-w-[80%] text-[12.5px] leading-relaxed text-white/80">
                  {s.sub}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      {n > 1 && arrows && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white group-hover:grid"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white group-hover:grid"
          >
            <FiChevronRight size={16} />
          </button>
        </>
      )}

      {n > 1 && (
        <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= main ================= */
export default function BookingWizard({ clinics = [], doctors = [] }) {
  const clinic = clinics[0];
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null); // hidden — auto-picked per doctor, not user-facing
  const [serviceLoading, setServiceLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pay_at_clinic"); // 'online' | 'clinic'
  const [appointment, setAppointment] = useState(null);
  const [bookFor, setBookFor] = useState(null); // patient id (self or family member)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topRef = useRef(null);
  const hydrated = useRef(false); // URL restored, safe to start writing params
  const pendingSlot = useRef(""); // slot from URL, applied once slots arrive
  const firstStepRender = useRef(true);

  const clinicImages = useMemo(() => collectImages(clinic), [clinic]);
  const promoSlides = useMemo(() => {
    const base = [
      {
        type: "promo",
        title: "Healthy Mind,",
        accent: "Healthy Life",
        sub: "Expert neurology care for a better, healthier you.",
      },
      {
        type: "promo",
        title: "Accurate Diagnosis,",
        accent: "Personal Care",
        sub: "Consult Dr Neeraj Kumar, Senior Consultant Neurologist.",
      },
      {
        type: "promo",
        title: "Brain, Nerve & Spine,",
        accent: "Expert Hands",
        sub: "Care for migraine, epilepsy, stroke and more.",
      },
    ];
    const imgs = clinicImages.map((src, idx) => ({
      type: "image",
      src,
      alt: clinic?.name,
      caption: idx === 0 ? clinic?.name : undefined,
    }));
    const mixed = [];
    const max = Math.max(imgs.length, base.length);
    for (let k = 0; k < max; k++) {
      if (imgs[k]) mixed.push(imgs[k]);
      if (base[k]) mixed.push(base[k]);
    }
    return mixed;
  }, [clinicImages, clinic]);

  const wideSlides = useMemo(
    () =>
      clinicImages.map((src) => ({ type: "image", src, alt: clinic?.name })),
    [clinicImages, clinic],
  );

  /* ---------- restore everything from the URL on mount ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoggedIn(!!getPatientToken());

      const q = new URLSearchParams(window.location.search);
      const rawStep = parseInt(q.get("step") || "", 10);
      const docId = q.get("doctor");
      const date = q.get("date");
      const slot = q.get("slot");
      const pay = q.get("pay");
      const coupon = q.get("coupon");

      if (pay === "online" || pay === "pay_at_clinic") setPaymentMethod(pay);
      if (coupon) setCouponCode(coupon.toUpperCase());

      let doc = null;
      if (docId) doc = doctors.find((d) => String(d.id) === String(docId)) || null;

      if (doc) {
        setSelectedDoctor(doc);
        setServiceLoading(true);
        try {
          const res = await apiClient.get(`/doctors/${doc.slug}`);
          if (!cancelled) setSelectedService((res.data.services || [])[0] || null);
        } catch (e) {
          if (!cancelled) setSelectedService(null);
        }
        if (!cancelled) setServiceLoading(false);
      }

      const wantStep = Number.isFinite(rawStep) ? rawStep : doc ? 2 : 1;

      // confirmed appointment survives a refresh via sessionStorage
      let appt = null;
      if (wantStep >= 4) {
        try {
          appt = JSON.parse(sessionStorage.getItem(APPT_KEY) || "null");
        } catch (e) {
          appt = null;
        }
        if (appt) setAppointment(appt);
      }

      const dateOk = !!date && date >= todayIso();
      if (doc && dateOk) {
        pendingSlot.current = slot || "";
        setSelectedDate(date); // triggers slot fetch, slot re-applied after
      }

      // never land on a step the restored data can't support
      let max = 1;
      if (doc) max = 2;
      if (doc && dateOk && slot) max = 3;
      if (appt) max = 4;

      if (!cancelled) {
        setStep(Math.max(1, Math.min(wantStep, max)));
        hydrated.current = true;
        setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- keep the URL in sync with the wizard ---------- */
  useEffect(() => {
    if (!hydrated.current) return;
    const p = new URLSearchParams();
    p.set("step", String(step));
    if (selectedDoctor?.id) p.set("doctor", String(selectedDoctor.id));
    if (selectedDate) p.set("date", selectedDate);
    if (selectedSlot) p.set("slot", selectedSlot);
    p.set("pay", paymentMethod);
    if (couponCode) p.set("coupon", couponCode);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${p.toString()}`,
    );
  }, [
    step,
    selectedDoctor,
    selectedDate,
    selectedSlot,
    paymentMethod,
    couponCode,
  ]);

  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const selectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedService(null);
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot("");
    setCouponResult(null);
    setError("");
    setStep(2);
    setServiceLoading(true);
    try {
      const res = await apiClient.get(`/doctors/${doctor.slug}`);
      const svc = (res.data.services || [])[0] || null;
      setSelectedService(svc);
    } catch (e) {
      setSelectedService(null);
      setError("Could not load doctor details. Please try again.");
    }
    setServiceLoading(false);
  };

  const fetchSlots = useCallback(
    async (date) => {
      if (!selectedDoctor || !clinic) return;
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot("");
      try {
        const res = await apiClient.get("/appointments/available-slots", {
          params: {
            doctor_id: selectedDoctor.id,
            clinic_id: clinic.id,
            service_id: selectedService?.id,
            date,
          },
        });
        const list = res.data.slots || [];
        setSlots(list);
        if (pendingSlot.current && list.includes(pendingSlot.current)) {
          setSelectedSlot(pendingSlot.current);
        }
      } catch (e) {
        setSlots([]);
      }
      pendingSlot.current = "";
      setSlotsLoading(false);
    },
    [selectedDoctor, clinic, selectedService],
  );

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const applyCoupon = async () => {
    setCouponError("");
    setCouponResult(null);
    if (!couponCode) return;
    if (!isLoggedIn) {
      setCouponError("Please login first to apply a coupon");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await apiClient.post("/patients/coupons/validate", {
        code: couponCode,
        service_id: selectedService?.id,
        amount: selectedDoctor.consultation_fee,
      });
      setCouponResult(res.data);
    } catch (e) {
      setCouponError(e.response?.data?.message || "Invalid coupon");
    }
    setCouponLoading(false);
  };

  const proceedToPayment = () => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    setError("");
    setStep(3);
  };

  const startOver = () => {
    try {
      sessionStorage.removeItem(APPT_KEY);
    } catch (e) {}
    setAppointment(null);
    setSelectedService(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot("");
    setCouponCode("");
    setCouponResult(null);
    setError("");
    setStep(1);
  };

  const confirmBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/patients/appointments/book", {
        clinic_id: clinic.id,
        doctor_id: selectedDoctor.id,
        service_id: selectedService?.id,
        appointment_date: selectedDate,
        booked_via: "website",
        start_time: selectedSlot,
        coupon_code: couponResult ? couponCode : undefined,
        payment_method: paymentMethod,
        member_patient_id: bookFor || undefined,
      });
      const appt = res.data.appointment;
      setAppointment(appt);
      try {
        sessionStorage.setItem(APPT_KEY, JSON.stringify(appt));
      } catch (e) {}
      if (res.data.requiresPayment && paymentMethod === "online") {
        await launchRazorpay(appt);
      } else {
        setStep(4);
      }
    } catch (e) {
      setError(
        e.response?.data?.message || "Booking failed. Please try another slot.",
      );
    }
    setLoading(false);
  };

  const launchRazorpay = async (appt) => {
    try {
      const orderRes = await apiClient.post("/patients/payments/create-order", {
        appointment_id: appt.id,
      });
      const { order, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: clinic?.name || "Clinic",
        description: `Consultation with ${selectedDoctor.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await apiClient.post("/patients/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStep(4);
          } catch (e) {
            setError("Payment verification failed. Please contact the clinic.");
          }
        },
        modal: {
          ondismiss: () =>
            setError(
              "Payment cancelled. Your slot is held briefly — you can retry.",
            ),
        },
        theme: { color: PRIMARY },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      setError("Could not start payment. Please try again.");
    }
  };

  const tLines = timingLines(clinic?.timing_json);
  const fee = parseFloat(selectedDoctor?.consultation_fee) || 0;
  const discount =
    paymentMethod === "online" ? parseFloat(couponResult?.discount) || 0 : 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-slate-50 to-brand-50/40">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* ===== top banner ===== */}
      <div className="bg-gradient-to-r from-[#11417E] via-[#0D5CA8] to-[#08A599] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto flex max-w-[1440px] min-w-0 flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/15 text-2xl sm:h-12 sm:w-12">
              <ImgWithFallback
                src={clinic?.image_url}
                alt={clinic?.name}
                className="h-full w-full object-cover"
                fallback={<span>🧠</span>}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight text-white sm:text-xl">
                {clinic?.name || "Clinic"}
              </p>
              <p className="truncate text-[12px] text-white/70 sm:text-[13px]">
                Book an appointment in under a minute
              </p>
            </div>
          </div>

          {clinic?.appointment_number && (
            <a
              href={`tel:${clinic.appointment_number}`}
              className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2 transition hover:bg-white/20 sm:px-4 sm:py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                <FiPhone size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] text-white/60">Need help?</p>
                <p className="whitespace-nowrap text-[12.5px] font-semibold text-white sm:text-[13px]">
                  +91 {clinic.appointment_number}
                </p>
              </div>
            </a>
          )}
        </div>

        <div className="mx-auto mt-4 flex max-w-[1440px] flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-white/80 sm:gap-x-6 sm:text-[12.5px]">
          <span className="flex items-center gap-1.5">
            <FiShield size={13} /> Secure &amp; confidential
          </span>
          <span className="flex items-center gap-1.5">
            <FiUsers size={13} /> 24+ years of experience
          </span>
          <span className="flex items-center gap-1.5">
            <FiAward size={13} /> Hassle-free booking
          </span>
        </div>
      </div>

      {/* ===== body ===== */}
      <div
        className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7"
        ref={topRef}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
          {/* ---- LEFT: doctor + clinic ---- */}
          <aside className="order-3 min-w-0 space-y-4 xl:order-1 xl:w-[292px] xl:shrink-0 xl:self-start xl:sticky xl:top-5">
            {selectedDoctor && <DoctorCard doctor={selectedDoctor} />}

            <Slider slides={promoSlides} heightClass="h-[168px]" arrows />

            <div className={`${card} p-5`}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                About our clinic
              </p>
              <p className="text-[13px] leading-relaxed text-slate-500">
                Expert neurology care for brain, nerve and spine conditions with a
                patient-first approach.
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  [FiAward, "24+ years of neurology experience"],
                  [FiShield, "Accurate, evidence-based diagnosis"],
                  [FiUsers, "Caring, patient-first approach"],
                  [FiHeart, "Personalised treatment plans"],
                ].map(([Icon, label]) => (
                  <li
                    key={label}
                    className="flex items-center gap-2.5 text-[12.5px] text-slate-600"
                  >
                    <span className="grid h-7 w-7 capitalize shrink-0 place-items-center rounded-lg bg-[#0D5CA8]/10 text-[#0D5CA8]">
                      <Icon size={14} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {tLines.length > 0 && (
              <div className={`${card} p-5`}>
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <FiClock size={13} className="text-[#0D5CA8]" /> Clinic
                  timings
                </p>
                {tLines.map((l) => (
                  <div
                    key={l.label}
                    className="flex items-start justify-between gap-3 py-1 text-[12.5px]"
                  >
                    <span className="shrink-0 font-semibold text-slate-700">
                      {l.label}
                    </span>
                    <span className="text-right text-slate-500">{l.value}</span>
                  </div>
                ))}
              </div>
            )}

            {clinic?.address && (
              <div className={`${card} p-5`}>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <FiMapPin size={13} className="text-[#0D5CA8]" /> Our location
                </p>
                <p className="text-[12.5px] leading-relaxed text-slate-500">
                  {clinic.address}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0D5CA8] hover:text-[#11417E]"
                >
                  View on map <FiArrowRight size={12} />
                </a>
              </div>
            )}

            {clinic?.whatsapp_number && (
              <a
                href={`https://wa.me/91${clinic.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 transition hover:bg-green-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
                  <FiMessageCircle size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-green-800">
                    Chat on WhatsApp
                  </span>
                  <span className="block text-[11.5px] text-green-700/70">
                    Quick support — we&apos;re here to help
                  </span>
                </span>
                <FiChevronRight size={16} className="shrink-0 text-green-600" />
              </a>
            )}
          </aside>

          {/* ---- CENTER: wizard ---- */}
          <main className="order-1 min-w-0 flex-1 space-y-4">
            <div className={`${card} p-4 sm:p-6 lg:p-7`}>
              {booting ? (
                <BootingSkeleton />
              ) : (
                <>
                  <StepIndicator step={step} />

                  {step < 4 && selectedDoctor && (
                    <SummaryStrip
                      doctor={selectedDoctor}
                      date={selectedDate}
                      slot={selectedSlot}
                    />
                  )}

                  {step === 3 && wideSlides.length > 0 && (
                    <div className="mb-6">
                      <Slider
                        slides={wideSlides}
                        heightClass="h-40 sm:h-48"
                        arrows
                      />
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="mb-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600"
                    >
                      <FiAlertCircle size={16} className="mt-px shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {step === 1 && (
                    <DoctorStep
                      doctors={doctors}
                      selected={selectedDoctor}
                      onSelect={selectDoctor}
                    />
                  )}

                  {step === 2 && selectedDoctor && (
                    <DateTimeStep
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      slots={slots}
                      slotsLoading={slotsLoading || serviceLoading}
                      selectedSlot={selectedSlot}
                      setSelectedSlot={setSelectedSlot}
                      onNext={proceedToPayment}
                      onBack={() => setStep(1)}
                    />
                  )}

                  {step === 3 && (
                    <PaymentStep
                      isLoggedIn={isLoggedIn}
                      onLoggedIn={() => setIsLoggedIn(true)}
                      fee={fee}
                      couponCode={couponCode}
                      setCouponCode={setCouponCode}
                      couponResult={couponResult}
                      couponError={couponError}
                      couponLoading={couponLoading}
                      applyCoupon={applyCoupon}
                      paymentMethod={paymentMethod}
                      setPaymentMethod={setPaymentMethod}
                      onConfirm={confirmBooking}
                      onBack={() => setStep(2)}
                      loading={loading}
                      bookFor={bookFor}
                      onBookForChange={(id) => setBookFor(id)}
                    />
                  )}

                  {step === 4 && appointment && (
                    <ConfirmationStep
                      appointment={appointment}
                      doctor={selectedDoctor}
                      paymentMethod={paymentMethod}
                      onStartOver={startOver}
                    />
                  )}
                </>
              )}
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-slate-400">
              <FiLock size={12} className="shrink-0" /> Your information is
              secure and encrypted
            </p>
          </main>

          {/* ---- RIGHT: summary + trust ---- */}
          <aside className="order-2 min-w-0 space-y-4 xl:order-3 xl:w-[330px] xl:shrink-0 xl:self-start xl:sticky xl:top-5">
            {!booting && selectedDoctor && step < 4 && (
              <AppointmentSummary
                doctor={selectedDoctor}
                date={selectedDate}
                slot={selectedSlot}
                step={step}
                paymentMethod={paymentMethod}
                fee={fee}
                discount={discount}
                phone={clinic?.appointment_number}
              />
            )}

            <div className={`${card} overflow-hidden`}>
              <div className="px-5 pt-5">
                <p className="text-[14px] font-bold text-[#0D5CA8]">
                  Why patients trust us
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  [FiUsers, "DM", "Neurology"],
                  [FiAward, "24+", "Years experience"],
                  [FiStar, "5.0", "Google rating"],
                  [FiShield, "Safe", "Data protected"],
                ].map(([Icon, big, small]) => (
                  <div
                    key={small}
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#0D5CA8] shadow-sm">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-slate-900">
                        {big}
                      </p>
                      <p className="truncate text-[10.5px] text-slate-500">
                        {small}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${card} p-5`}>
              <p className="mb-3 text-[14px] font-bold text-[#0D5CA8]">
                What to expect
              </p>
              <ul className="space-y-2.5">
                {[
                  "Expert consultation",
                  "Advanced treatment",
                  "Comfortable experience",
                  "Better oral health",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-2 text-[12.5px] text-slate-600"
                  >
                    <FiCheckCircle
                      size={15}
                      className="shrink-0 text-green-500"
                    />{" "}
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* ===== bottom trust bar ===== */}
        <div
          className={`${card} mt-5 grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4`}
        >
          {[
            [
              FiCalendar,
              "Hassle-free booking",
              "Quick and easy, in just a few clicks.",
            ],
            [
              FiShield,
              "Secure & confidential",
              "Your data is safe with us. Always.",
            ],
            [
              FiActivity,
              "Expert neurology care",
              "Experienced neurologist, accurate diagnosis.",
            ],
            [
              FiThumbsUp,
              "24+ years of experience",
              "We care about your health and well-being.",
            ],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0D5CA8]/10 text-[#0D5CA8]">
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#0D5CA8]">{title}</p>
                <p className="text-[11.5px] leading-relaxed text-slate-500">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= booting skeleton ================= */
function BootingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-32 rounded bg-slate-100" />
        <div className="h-6 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100" />
      <div className="h-16 w-full rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/* ================= doctor sidebar card ================= */
function DoctorCard({ doctor }) {
  return (
    <div className={`${card} p-5`}>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0D5CA8]">
        <FiUser size={12} /> Your doctor
      </p>
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#11417E] via-[#0D5CA8] to-[#08A599] text-xl font-bold text-white ring-2 ring-[#0D5CA8]/15">
          <ImgWithFallback
            src={doctor.photo_url}
            alt={doctor.name}
            className="h-full w-full object-cover"
            fallback={
              <span>{doctor.name?.replace(/^Dr\.?\s*/i, "")?.[0] || "D"}</span>
            }
          />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-bold text-slate-900">
            <span className="truncate">{doctor.name}</span>
            <FiCheckCircle size={14} className="shrink-0 text-[#0D5CA8]" />
          </p>
          <p className="truncate text-[12px] text-slate-500">
            {doctor.qualification}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
            {!!doctor.rating && (
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <FiStar size={11} className="fill-amber-500 text-amber-500" />{" "}
                {doctor.rating}
              </span>
            )}
            {!!doctor.experience_years && (
              <span className="flex items-center gap-1 text-slate-500">
                <FiAward size={11} className="text-[#0D5CA8]" />{" "}
                {doctor.experience_years}+ yrs
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= step indicator ================= */
function StepIndicator({ step }) {
  const clamped = Math.min(step, STEPS.length);
  const pct = (clamped / STEPS.length) * 100;
  const done = step > STEPS.length;

  return (
    <div className="mb-5 sm:mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-slate-900">
          Step {clamped} of {STEPS.length}
          <span className="ml-2 font-medium text-slate-400">
            {STEPS[clamped - 1]}
          </span>
        </p>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold ${
            done || pct === 100
              ? "bg-green-50 text-green-700"
              : "bg-[#0D5CA8]/10 text-[#0D5CA8]"
          }`}
        >
          {(done || pct === 100) && <FiCheckCircle size={13} />}
          {Math.round(pct)}% complete {(done || pct === 100) && "🎉"}
        </span>
      </div>

      {/* desktop rail */}
      <div className="hidden items-center sm:flex">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isDone = num < clamped || done;
          const active = num === clamped && !done;
          return (
            <div
              key={label}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11.5px] font-bold transition ${
                    isDone
                      ? "bg-[#0D5CA8] text-white"
                      : active
                        ? "bg-[#0D5CA8] text-white ring-4 ring-[#0D5CA8]/15"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? <FiCheck size={13} /> : num}
                </span>
                <span
                  className={`whitespace-nowrap text-[12.5px] font-semibold ${
                    active
                      ? "text-[#0D5CA8]"
                      : isDone
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2.5 h-[2px] flex-1 rounded-full bg-slate-100 lg:mx-4">
                  <div
                    className={`h-full rounded-full bg-[#0D5CA8] transition-all duration-500 ${
                      num < clamped || done ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* mobile rail */}
      <div className="flex items-center gap-2 sm:hidden">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isDone = num < clamped || done;
          const active = num === clamped && !done;
          return (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                isDone
                  ? "bg-[#0D5CA8]"
                  : active
                    ? "bg-[#0D5CA8]/50"
                    : "bg-slate-100"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ================= selection summary strip ================= */
function SummaryStrip({ doctor, date, slot }) {
  const items = [
    { icon: FiUser, label: "Doctor", value: doctor?.name },
    { icon: FiCalendar, label: "Date", value: date ? prettyDate(date) : null },
    { icon: FiClock, label: "Time", value: slot ? to12h(slot) : null },
  ].filter((i) => i.value);

  if (!items.length) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200/70 sm:grid-cols-4">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex min-w-0 items-center gap-2.5 bg-gradient-to-br from-slate-50 to-brand-50/60 px-3 py-3.5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#0D5CA8] shadow-sm">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="truncate text-[12.5px] font-semibold text-slate-800">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= appointment summary rail ================= */
function AppointmentSummary({
  doctor,
  date,
  slot,
  step,
  paymentMethod,
  fee,
  discount,
  phone,
}) {
  const total = Math.max(0, fee - discount);
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#11417E] via-[#0D5CA8] to-[#08A599] px-5 py-3.5">
        <FiCalendar size={15} className="text-white" />
        <p className="text-[12px] font-bold uppercase tracking-wider text-white">
          Appointment summary
        </p>
      </div>

      <div className="p-5">
        <SumRow icon={FiUser} label="Doctor" value={doctor?.name || "—"} />
        <SumRow
          icon={FiCalendar}
          label="Date"
          value={date ? prettyDate(date) : "—"}
        />
        <SumRow icon={FiClock} label="Time" value={slot ? to12h(slot) : "—"} />
        {step >= 3 && fee > 0 && (
          <>
            <SumRow
              icon={FiCreditCard}
              label="Payment"
              value={paymentMethod === "online" ? "Online" : "At clinic"}
            />
            <div className="my-3 border-t border-dashed border-slate-200" />
            <div className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-slate-500">Consultation fee</span>
              <span className="font-semibold text-slate-800">₹{fee}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between py-1 text-[13px]">
                <span className="text-slate-500">Coupon discount</span>
                <span className="font-semibold text-green-600">
                  − ₹{discount}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-[#0D5CA8]/[0.06] px-3.5 py-2.5">
              <span className="text-[12.5px] font-semibold text-slate-700">
                {paymentMethod === "online"
                  ? "Payable now"
                  : "Payable at clinic"}
              </span>
              <span className="text-[15px] font-extrabold text-[#0D5CA8]">
                ₹{total}
              </span>
            </div>
          </>
        )}

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-900">
            <FiEdit3 size={13} /> Need to change?
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-amber-800/80">
            You can reschedule or cancel this appointment anytime.
          </p>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              <FiHeadphones size={13} /> Call the clinic
            </a>
          ) : (
            <a
              href="/profile"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              Manage appointment <FiArrowRight size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SumRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-slate-500">
        <Icon size={14} className="text-[#0D5CA8]" /> {label}
      </span>
      <span className="truncate text-right text-[13px] font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function SectionHead({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0D5CA8]/10 text-[#0D5CA8]">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-500 sm:text-sm">{sub}</p>
      </div>
    </div>
  );
}

/* ================= step 1 ================= */
function DoctorStep({ doctors, selected, onSelect }) {
  return (
    <div>
      <SectionHead
        icon={FiUser}
        title="Choose your doctor"
        sub="Available specialists at our clinic."
      />

      <div className="mt-5 space-y-3">
        {doctors.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No doctors available for online booking right now. Call the
            clinic to book.
          </p>
        ) : (
          doctors.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className={`group flex w-full min-w-0 items-start gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0D5CA8] hover:shadow-lg hover:shadow-[#0D5CA8]/10 focus:outline-none focus-visible:border-[#0D5CA8] focus-visible:ring-4 focus-visible:ring-[#0D5CA8]/15 sm:gap-4 sm:p-4 ${
                selected?.id === d.id ? "border-[#0D5CA8]" : "border-slate-100"
              }`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#11417E] via-[#0D5CA8] to-[#08A599] text-lg font-bold text-white">
                <ImgWithFallback
                  src={d.photo_url}
                  alt={d.name}
                  className="h-full w-full object-cover"
                  fallback={
                    <span>{d.name?.replace(/^Dr\.?\s*/i, "")?.[0] || "D"}</span>
                  }
                />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">
                    {d.name}
                  </p>
                  {!!d.rating && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                      <FiStar
                        size={10}
                        className="fill-amber-500 text-amber-500"
                      />{" "}
                      {d.rating}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {d.qualification}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-400">
                  {d.specialization && (
                    <span className="flex items-center gap-1">
                      <FiActivity size={11} className="text-[#0D5CA8]" />{" "}
                      {d.specialization}
                    </span>
                  )}
                  {!!d.experience_years && (
                    <span className="flex items-center gap-1">
                      <FiAward size={11} className="text-[#0D5CA8]" />{" "}
                      {d.experience_years}+ yrs exp
                    </span>
                  )}
                  {!!d.consultation_fee && (
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <FiTag size={11} className="text-[#0D5CA8]" /> ₹
                      {d.consultation_fee}
                    </span>
                  )}
                </div>
                {d.bio && (
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
                    {d.bio}
                  </p>
                )}
              </div>

              <FiArrowRight
                size={16}
                className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0D5CA8]"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= step 2 ================= */
function DateTimeStep({
  selectedDate,
  setSelectedDate,
  slots,
  slotsLoading,
  selectedSlot,
  setSelectedSlot,
  onNext,
  onBack,
}) {
  const days = nextDays(14);
  const today = days[0].iso;
  const maxDate = days[days.length - 1].iso;

  const groups = [
    {
      key: "Morning",
      icon: FiSunrise,
      items: slots.filter((s) => hourOf(s) < 12),
    },
    {
      key: "Afternoon",
      icon: FiSun,
      items: slots.filter((s) => hourOf(s) >= 12 && hourOf(s) < 17),
    },
    {
      key: "Evening",
      icon: FiSunset,
      items: slots.filter((s) => hourOf(s) >= 17),
    },
  ].filter((g) => g.items.length);

  return (
    <div className="min-w-0">
      <SectionHead
        icon={FiCalendar}
        title="Pick a date & time"
        sub="Select a day, then choose an available slot."
      />

      <div className="-mx-1 mt-5 flex w-full max-w-full gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const active = selectedDate === d.iso;
          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={`flex h-[68px] w-[58px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition sm:h-[74px] sm:w-[64px] ${
                active
                  ? "border-[#0D5CA8] bg-[#0D5CA8] text-white shadow-lg shadow-[#0D5CA8]/25"
                  : "border-slate-100 bg-white text-slate-700 hover:border-[#0D5CA8]/40"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase ${active ? "text-white/70" : "text-slate-400"}`}
              >
                {d.label || d.dow}
              </span>
              <span className="text-lg font-bold leading-none">{d.day}</span>
              <span
                className={`text-[10px] ${active ? "text-white/70" : "text-slate-400"}`}
              >
                {d.mon}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-500">
        <FiCalendar size={14} className="text-[#0D5CA8]" />
        Or pick another date
        <input
          type="date"
          min={today}
          max={maxDate}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-full rounded-lg border-2 border-slate-200 px-2.5 py-1.5 text-[12.5px] text-slate-700 outline-none transition focus:border-[#0D5CA8]"
        />
      </label>

      {selectedDate && (
        <div className="mt-6 sm:mt-7">
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            <FiClock size={15} className="text-[#0D5CA8]" /> Available slots
            <span className="font-normal text-slate-400">
              — {prettyDate(selectedDate)}
            </span>
          </p>

          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
              <FiAlertCircle size={15} className="mt-px shrink-0" />
              <span>
                No slots left on this date. Try the next available day.
              </span>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map(({ key, icon: Icon, items }) => (
                <div key={key}>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    <Icon size={13} /> {key}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                    {items.map((s) => {
                      const active = selectedSlot === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-xl border-2 py-2.5 text-[12.5px] font-semibold transition sm:text-[13px] ${
                            active
                              ? "border-[#0D5CA8] bg-[#0D5CA8] text-white shadow-lg shadow-[#0D5CA8]/25"
                              : "border-slate-200 bg-white text-slate-700 hover:border-[#0D5CA8] hover:text-[#0D5CA8]"
                          }`}
                        >
                          {to12h(s)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={onBack} className={btnGhost}>
          <FiArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSlot}
          className={`${btnPrimary} sm:flex-none`}
        >
          Continue <FiArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ================= step 3 ================= */
function PaymentStep({
  isLoggedIn,
  onLoggedIn,
  fee,
  couponCode,
  setCouponCode,
  couponResult,
  couponError,
  couponLoading,
  applyCoupon,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  onBack,
  loading,
  bookFor,
  onBookForChange,
}) {
  const isFree = fee === 0;

  return (
    <div className="min-w-0">
      <div className="relative mb-5 flex h-40 items-center justify-between gap-4 overflow-hidden rounded-2xl bg-brand-gradient px-6 text-white sm:h-52 sm:px-10">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Neurocare Clinic
          </p>
          <p className="mt-1 text-xl font-extrabold leading-tight sm:text-3xl">
            Your Health,
            <br />
            Our Priority
          </p>
          <p className="mt-2 text-xs text-white/80 sm:text-sm">
            Safe · Confidential · Trusted
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt=""
          className="relative z-10 h-28 w-28 shrink-0 rounded-full bg-white object-contain p-2 sm:h-40 sm:w-40"
        />
      </div>

      <SectionHead
        icon={FiShield}
        title={
          isLoggedIn
            ? "Review & confirm your appointment"
            : "Verify your number"
        }
        sub={
          isLoggedIn
            ? "Check the details, then confirm your booking."
            : "Log in with a quick OTP to hold your slot."
        }
      />

      <div className="mt-5">
        {!isLoggedIn ? (
          <LoginBox onLoggedIn={onLoggedIn} />
        ) : (
          <>
            <FamilyMemberPicker value={bookFor} onChange={onBookForChange} />

            {!isFree && (
              <div className="mb-5">
                <p className="text-[14px] font-bold text-slate-900">
                  How would you like to pay?
                </p>
                <p className="mb-3 text-[12.5px] text-slate-500">
                  Choose your preferred payment method
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* <PayOption
                    active={paymentMethod === "online"}
                    onClick={() => setPaymentMethod("online")}
                    icon={FiCreditCard}
                    title="Pay online"
                    sub="Secure payment via Razorpay"
                    meta="Cards, UPI, wallets"
                  /> */}
                  <PayOption
                    active={paymentMethod === "pay_at_clinic"}
                    onClick={() => setPaymentMethod("pay_at_clinic")}
                    icon={FiHome}
                    title="Pay at clinic"
                    sub="Cash or card on your visit"
                    badge="Recommended"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "online" && !isFree && (
              <div className="mb-5">
                <p className="mb-2 text-[13px] font-semibold text-slate-700">
                  Have a coupon?
                </p>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <FiTag
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm tracking-wide text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#0D5CA8] focus:bg-white focus:ring-4 focus:ring-[#0D5CA8]/10"
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode}
                    className={btnGhost}
                  >
                    {couponLoading ? <Spinner /> : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                    <FiAlertCircle size={13} /> {couponError}
                  </p>
                )}
                {couponResult && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <FiCheckCircle size={13} /> Coupon applied
                  </p>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-[#0D5CA8]/15 bg-[#0D5CA8]/[0.05] px-4 py-3 text-[12.5px] text-slate-600">
              <FiInfo size={15} className="mt-px shrink-0 text-[#0D5CA8]" />
              <span>
                {paymentMethod === "online" || isFree
                  ? "Payments are secured by Razorpay. No card details are stored."
                  : "Please carry cash or a card — payable at the clinic reception."}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={onBack} className={btnGhost}>
                <FiArrowLeft size={15} /> Back
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`${btnPrimary} sm:flex-1`}
              >
                {loading ? (
                  <>
                    <Spinner /> Processing…
                  </>
                ) : isFree || paymentMethod === "clinic" ? (
                  <>
                    <FiCheckCircle size={16} /> Confirm appointment
                  </>
                ) : (
                  <>
                    <FiCreditCard size={16} /> Proceed to pay
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PayOption({ active, onClick, icon: Icon, title, sub, meta, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
        active
          ? "border-[#0D5CA8] bg-[#0D5CA8]/[0.05] shadow-md shadow-[#0D5CA8]/10"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
          active
            ? "bg-gradient-to-br from-[#11417E] via-[#0D5CA8] to-[#08A599] text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1 pr-6">
        <span className="block text-[14px] font-bold text-slate-900">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">
          {sub}
        </span>
        {meta && (
          <span className="mt-1.5 block text-[11.5px] text-slate-400">
            {meta}
          </span>
        )}
        {badge && (
          <span className="mt-2 inline-block rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
            {badge}
          </span>
        )}
      </span>
      <span
        className={`absolute right-3.5 top-3.5 grid h-5 w-5 place-items-center rounded-full border-2 transition ${
          active
            ? "border-[#0D5CA8] bg-[#0D5CA8] text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {active && <FiCheck size={11} />}
      </span>
    </button>
  );
}

/* ================= OTP login ================= */
function OtpBoxes({ value, onChange, onComplete, disabled }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    const merged = (value.slice(0, i) + raw).slice(0, 6);
    onChange(merged);
    refs.current[Math.min(merged.length, 5)]?.focus();
    if (merged.length === 6) onComplete?.(merged);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!p) return;
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
    if (p.length === 6) onComplete?.(p);
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-11 w-full rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-[#0D5CA8] focus:bg-white focus:ring-4 focus:ring-[#0D5CA8]/10 disabled:opacity-50 sm:h-12"
        />
      ))}
    </div>
  );
}

function LoginBox({ onLoggedIn }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [patient, setPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const [form, setForm] = useState({
    name: "",
    father_husband_name: "",
    email: "",
    gender: "",
    dob: "",
    nationality: "",
    marital_status: "",
    permanent_address: "",
    permanent_pincode: "",
    local_address: "",
    local_pincode: "",
    referred_by: "",
    referrer_name: "",
    referrer_address: "",
    consent_date: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;

    const t = setTimeout(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [cooldown]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if DB field is empty
  const isEmpty = (field) => {
    // New patient -> show all fields
    if (isNewPatient || !patient) {
      return true;
    }

    const value = patient[field];

    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );
  };

  const sendOtp = async (resend = false) => {
    setErr("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setErr("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/auth/send-otp", {
        mobile,
      });

      if (!resend) {
        setOtp("");
      }

      const existingPatient = res.data.patient || null;

      setPatient(existingPatient);
      setIsNewPatient(!existingPatient);

      // Put existing values in state as well
      if (existingPatient) {
        setForm({
          name: existingPatient.name || "",
          father_husband_name:
            existingPatient.father_husband_name || "",
          email: existingPatient.email || "",
          gender: existingPatient.gender || "",
          dob: existingPatient.dob
            ? existingPatient.dob.split("T")[0]
            : "",
          nationality: existingPatient.nationality || "",
          marital_status:
            existingPatient.marital_status || "",
          permanent_address:
            existingPatient.permanent_address || "",
          permanent_pincode:
            existingPatient.permanent_pincode || "",
          local_address:
            existingPatient.local_address || "",
          local_pincode:
            existingPatient.local_pincode || "",
          referred_by:
            existingPatient.referred_by || "",
          referrer_name:
            existingPatient.referrer_name || "",
          referrer_address:
            existingPatient.referrer_address || "",
          consent_date:
            existingPatient.consent_date
              ? existingPatient.consent_date.split("T")[0]
              : "",
        });
      } else {
        setForm({
          name: "",
          father_husband_name: "",
          email: "",
          gender: "",
          dob: "",
          nationality: "Indian",
          marital_status: "",
          permanent_address: "",
          permanent_pincode: "",
          local_address: "",
          local_pincode: "",
          referred_by: "",
          referrer_name: "",
          referrer_address: "",
          consent_date: new Date().toISOString().split("T")[0],
        });
      }

      setOtpSent(true);
      setCooldown(30);
    } catch (e) {
      setErr(
        e.response?.data?.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code) => {
    const value =
      typeof code === "string" ? code : otp;

    setErr("");

    if (value.length !== 6) {
      setErr("Enter the 6-digit OTP");
      return;
    }

    // Name required if missing/new patient
    if (isEmpty("name") && !form.name.trim()) {
      setErr("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post(
        "/auth/verify-otp",
        {
          mobile,
          otp: value,

          name: form.name.trim() || null,
          father_husband_name:
            form.father_husband_name.trim() || null,
          email: form.email.trim() || null,
          gender: form.gender || null,
          dob: form.dob || null,
          nationality:
            form.nationality.trim() || null,
          marital_status:
            form.marital_status || null,

          permanent_address:
            form.permanent_address.trim() || null,
          permanent_pincode:
            form.permanent_pincode.trim() || null,

          local_address:
            form.local_address.trim() || null,
          local_pincode:
            form.local_pincode.trim() || null,

          referred_by:
            form.referred_by || null,

          referrer_name:
            form.referrer_name.trim() || null,

          referrer_address:
            form.referrer_address.trim() || null,

          consent_date:
            form.consent_date || null,
        },
      );

      setPatientToken(res.data.token);
      onLoggedIn();
    } catch (e) {
      setErr(
        e.response?.data?.message || "Invalid OTP",
      );

      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setOtpSent(false);
    setOtp("");
    setErr("");
    setCooldown(0);
    setPatient(null);
    setIsNewPatient(false);

    setForm({
      name: "",
      father_husband_name: "",
      email: "",
      gender: "",
      dob: "",
      nationality: "",
      marital_status: "",
      permanent_address: "",
      permanent_pincode: "",
      local_address: "",
      local_pincode: "",
      referred_by: "",
      referrer_name: "",
      referrer_address: "",
      consent_date: "",
    });
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border-2 border-slate-100 bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0D5CA8]/10 text-[#0D5CA8]">
          <FiUser size={17} />
        </span>

        <div>
          <p className="text-sm font-bold text-slate-900">
            Patient login
          </p>

          <p className="text-[11.5px] text-slate-500">
            New patients are registered automatically
          </p>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-600">
          <FiAlertCircle
            size={14}
            className="mt-px shrink-0"
          />

          <span>{err}</span>
        </div>
      )}

      {!otpSent ? (
        /* =========================
           MOBILE STEP
        ========================= */
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
              Mobile number
            </label>

            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#0D5CA8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0D5CA8]/10">
              <FiPhone
                size={15}
                className="shrink-0 text-slate-400"
              />

              <span className="border-r border-slate-200 pr-2.5 text-sm font-medium text-slate-600">
                +91
              </span>

              <input
                type="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                maxLength={10}
                value={mobile}
                onChange={(e) =>
                  setMobile(
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && sendOtp()
                }
                className="w-full bg-transparent py-3 text-[15px] tracking-wide text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={() => sendOtp()}
            disabled={
              loading || mobile.length !== 10
            }
            className={`${btnPrimary} w-full`}
          >
            {loading ? (
              <>
                <Spinner />
                Sending OTP…
              </>
            ) : (
              <>
                Send OTP
                <FiArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      ) : (
        /* =========================
           OTP + MISSING PROFILE
        ========================= */
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12.5px]">
            <span className="text-slate-500">
              Sent to{" "}
              <span className="font-semibold text-slate-800">
                +91 {mobile}
              </span>
            </span>

            <button
              onClick={resetLogin}
              className="font-semibold text-[#0D5CA8]"
            >
              Change
            </button>
          </div>

          {/* OTP */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-slate-700">
              One-time password
            </label>

            <OtpBoxes
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
          </div>

          {/* New patient message */}
          {isNewPatient && (
            <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
              <p className="text-sm font-semibold text-brand-800">
                Complete your profile
              </p>

              <p className="mt-1 text-xs text-brand-600">
                You&apos;re a new patient. Please enter
                your details below.
              </p>
            </div>
          )}

          {/* Existing incomplete profile */}
          {!isNewPatient &&
            [
              "name",
              "father_husband_name",
              "email",
              "gender",
              "dob",
              "nationality",
              "marital_status",
              "permanent_address",
              "permanent_pincode",
              "local_address",
              "local_pincode",
              "referred_by",
              "consent_date",
            ].some(isEmpty) && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  Complete missing information
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  Please fill only the missing patient
                  details.
                </p>
              </div>
            )}

          {/* ======================
              BASIC DETAILS
          ====================== */}

          {(isEmpty("name") ||
            isEmpty("father_husband_name") ||
            isEmpty("email") ||
            isEmpty("gender") ||
            isEmpty("dob") ||
            isEmpty("nationality") ||
            isEmpty("marital_status")) && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal details
              </p>

              {isEmpty("name") && (
                <LoginField label="Full Name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value,
                      )
                    }
                    className="input-field"
                    placeholder="Full name"
                  />
                </LoginField>
              )}

              {isEmpty("father_husband_name") && (
                <LoginField label="Father's / Husband's Name">
                  <input
                    type="text"
                    value={
                      form.father_husband_name
                    }
                    onChange={(e) =>
                      updateField(
                        "father_husband_name",
                        e.target.value,
                      )
                    }
                    className="input-field"
                    placeholder="Father's / husband's name"
                  />
                </LoginField>
              )}

              {isEmpty("email") && (
                <LoginField label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateField(
                        "email",
                        e.target.value,
                      )
                    }
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </LoginField>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {isEmpty("gender") && (
                  <LoginField label="Gender">
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        updateField(
                          "gender",
                          e.target.value,
                        )
                      }
                      className="input-field"
                    >
                      <option value="">
                        Select gender
                      </option>
                      <option value="male">
                        Male
                      </option>
                      <option value="female">
                        Female
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </LoginField>
                )}

                {isEmpty("dob") && (
                  <LoginField label="Date of Birth">
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) =>
                        updateField(
                          "dob",
                          e.target.value,
                        )
                      }
                      className="input-field"
                    />
                  </LoginField>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {isEmpty("nationality") && (
                  <LoginField label="Nationality">
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) =>
                        updateField(
                          "nationality",
                          e.target.value,
                        )
                      }
                      className="input-field"
                      placeholder="Indian"
                    />
                  </LoginField>
                )}

                {isEmpty("marital_status") && (
                  <LoginField label="Marital Status">
                    <select
                      value={
                        form.marital_status
                      }
                      onChange={(e) =>
                        updateField(
                          "marital_status",
                          e.target.value,
                        )
                      }
                      className="input-field"
                    >
                      <option value="">
                        Select status
                      </option>
                      <option value="married">
                        Married
                      </option>
                      <option value="unmarried">
                        Unmarried
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </LoginField>
                )}
              </div>
            </div>
          )}

          {/* ======================
              ADDRESS
          ====================== */}

          {(isEmpty("permanent_address") ||
            isEmpty("permanent_pincode") ||
            isEmpty("local_address") ||
            isEmpty("local_pincode")) && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Address
              </p>

              {isEmpty("permanent_address") && (
                <LoginField label="Permanent Address">
                  <textarea
                    rows={3}
                    value={
                      form.permanent_address
                    }
                    onChange={(e) =>
                      updateField(
                        "permanent_address",
                        e.target.value,
                      )
                    }
                    className="input-field resize-none"
                    placeholder="Permanent address"
                  />
                </LoginField>
              )}

              {isEmpty("permanent_pincode") && (
                <LoginField label="Permanent Pin Code">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={
                      form.permanent_pincode
                    }
                    onChange={(e) =>
                      updateField(
                        "permanent_pincode",
                        e.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    className="input-field"
                    placeholder="110025"
                  />
                </LoginField>
              )}

              {isEmpty("local_address") && (
                <LoginField label="Local Address">
                  <textarea
                    rows={3}
                    value={form.local_address}
                    onChange={(e) =>
                      updateField(
                        "local_address",
                        e.target.value,
                      )
                    }
                    className="input-field resize-none"
                    placeholder="Current/local address"
                  />
                </LoginField>
              )}

              {isEmpty("local_pincode") && (
                <LoginField label="Local Pin Code">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.local_pincode}
                    onChange={(e) =>
                      updateField(
                        "local_pincode",
                        e.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    className="input-field"
                    placeholder="110025"
                  />
                </LoginField>
              )}
            </div>
          )}

          {/* ======================
              REFERRAL
          ====================== */}

          {isEmpty("referred_by") && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Referral Details
              </p>

              <LoginField label="Referred By">
                <select
                  value={form.referred_by}
                  onChange={(e) => {
                    const value = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      referred_by: value,
                      ...(value === "self"
                        ? {
                            referrer_name: "",
                            referrer_address: "",
                          }
                        : {}),
                    }));
                  }}
                  className="input-field"
                >
                  <option value="">
                    Select
                  </option>
                  <option value="doctor">
                    Doctor
                  </option>
                  <option value="hospital">
                    Hospital
                  </option>
                  <option value="organisation">
                    Organisation
                  </option>
                  <option value="self">
                    Self
                  </option>
                </select>
              </LoginField>
            </div>
          )}

          {/* Referrer fields */}
          {form.referred_by &&
            form.referred_by !== "self" && (
              <div className="space-y-4">
                {isEmpty("referrer_name") && (
                  <LoginField label="Referrer Name">
                    <input
                      type="text"
                      value={form.referrer_name}
                      onChange={(e) =>
                        updateField(
                          "referrer_name",
                          e.target.value,
                        )
                      }
                      className="input-field"
                      placeholder="Doctor / Hospital / Organisation"
                    />
                  </LoginField>
                )}

                {isEmpty("referrer_address") && (
                  <LoginField label="Referrer Address">
                    <textarea
                      rows={2}
                      value={
                        form.referrer_address
                      }
                      onChange={(e) =>
                        updateField(
                          "referrer_address",
                          e.target.value,
                        )
                      }
                      className="input-field resize-none"
                    />
                  </LoginField>
                )}
              </div>
            )}

          {/* Consent Date */}
          {isEmpty("consent_date") && (
            <LoginField label="Consent Date">
              <input
                type="date"
                value={form.consent_date}
                onChange={(e) =>
                  updateField(
                    "consent_date",
                    e.target.value,
                  )
                }
                className="input-field"
              />
            </LoginField>
          )}

          {/* Verify */}
          <button
            onClick={() => verify()}
            disabled={
              loading || otp.length !== 6
            }
            className={`${btnPrimary} w-full`}
          >
            {loading ? (
              <>
                <Spinner />
                Verifying…
              </>
            ) : (
              <>
                Verify &amp; continue
                <FiArrowRight size={15} />
              </>
            )}
          </button>

          {/* Resend */}
          <p className="text-center text-[12.5px] text-slate-500">
            Didn&apos;t get the code?{" "}
            {cooldown > 0 ? (
              <span className="font-medium text-slate-400">
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                onClick={() => sendOtp(true)}
                disabled={loading}
                className="font-semibold text-[#0D5CA8] hover:text-[#11417E]"
              >
                Resend OTP
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
/* ================= confirmation ================= */
function ConfirmationStep({
  appointment,
  doctor,
  paymentMethod,
  onStartOver,
}) {
  return (
    <div className="py-4 text-center sm:py-6">
      <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center sm:h-20 sm:w-20">
        <span className="absolute inset-0 animate-ping rounded-full bg-green-400/20 motion-reduce:animate-none" />
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-600 sm:h-20 sm:w-20">
          <FiCheckCircle size={34} className="sm:hidden" />
          <FiCheckCircle size={38} className="hidden sm:block" />
        </span>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Appointment confirmed
      </h2>
      <p className="mt-1.5 text-[13px] text-slate-500 sm:text-sm">
        We&apos;ve sent the details to your registered mobile number.
      </p>

      <div className="mx-auto mt-7 max-w-sm min-w-0 rounded-2xl border-2 border-[#0D5CA8]/15 bg-[#0D5CA8]/[0.04] p-5 text-left sm:mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D5CA8]">
            Booking ID
          </span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[13px] font-bold text-slate-900 ring-1 ring-[#0D5CA8]/15">
            {appointment.appointment_code}
          </span>
        </div>
        {appointment.patient_name && (
          <SumRow icon={FiUsers} label="Patient" value={appointment.patient_name} />
        )}
        {doctor && <SumRow icon={FiUser} label="Doctor" value={doctor.name} />}
        <SumRow
          icon={FiCalendar}
          label="Date"
          value={prettyDate(appointment.appointment_date)}
        />
        <SumRow
          icon={FiClock}
          label="Time"
          value={to12h(appointment.start_time)}
        />
        {paymentMethod === "clinic" && (
          <SumRow icon={FiCreditCard} label="Payment" value="Pay at clinic" />
        )}
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href="/profile" className={btnPrimary}>
          <FiCalendar size={16} /> View my appointments
        </a>
        <button onClick={onStartOver} className={btnGhost}>
          Book another appointment
        </button>
      </div>

      <p className="mt-6 px-2 text-[11.5px] text-slate-400 sm:text-[12px]">
        Please arrive 10 minutes early. To reschedule, call the clinic.
      </p>
    </div>
  );
}


function LoginField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}