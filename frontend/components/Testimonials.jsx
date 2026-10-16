'use client';

import { FiStar } from 'react-icons/fi';

export default function Testimonials({ reviews = [] }) {
  if (!reviews.length) return null;

  const items = [...reviews];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="text-center max-w-2xl mx-auto mb-12 px-4">
        <p className="section-eyebrow mb-2">What Our Patients Say</p>
        <h2 className="text-3xl font-bold text-slate-900">
          Real Stories from <span className="text-brand-600">Our Patients</span>
        </h2>
      </div>

      <div className="relative">
        <div className="group">
          <div className="flex w-max animate-scroll-left group-hover:[animation-play-state:paused]">
            {items.map((r, i) => (
              <div key={`${r.id}-${i}`} className="w-[340px] shrink-0 mx-3">
                <div className="relative bg-white border border-slate-100 rounded-2xl p-6 h-full shadow-sm hover:shadow-xl hover:shadow-brand-600/5 hover:-translate-y-1 transition-all duration-300">
                  <span className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-accent-500 text-white flex items-center justify-center text-lg font-serif shadow-md">
                    &ldquo;
                  </span>
                  <div className="flex gap-0.5 text-amber-400 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <FiStar key={j} className={j < r.rating ? 'fill-amber-400' : 'text-slate-200'} />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-4">
                    &ldquo;{r.review_text}&rdquo;
                  </p>
                  <p className="font-semibold text-slate-900">— {r.patient_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
