'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function HeroBannerSlider({ banners = [], className = '' }) {
  const slides = [...banners].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback((i) => {
    setActive((prev) => (i + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, slides.length]);

  if (!slides.length) return null;

  return (
    <section className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((banner) => (
          <div key={banner.id} className="w-full shrink-0 relative">
            {banner.cta_link ? (
            //   <Link href={banner.cta_link} className="block">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-auto block"
                />
            //   </Link>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className={`w-full block ${className}`}
              />
            )}

            {/* {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-center px-6 md:px-16">
                <div className="max-w-2xl">
                  {banner.title && (
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">{banner.title}</h1>
                  )}
                  {banner.subtitle && (
                    <p className="text-white/90 mb-5 text-sm md:text-base">{banner.subtitle}</p>
                  )}
                  {banner.cta_text && banner.cta_link && (
                    <Link href={banner.cta_link} className="btn-outline bg-white inline-block">
                      {banner.cta_text}
                    </Link>
                  )}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
          >
            <FiChevronRight />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? 'w-6 bg-white' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}