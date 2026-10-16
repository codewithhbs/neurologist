'use client';

import {
  Brain,
  Zap,
  Activity,
  Waves,
  HeartPulse,
  Move,
  ScanLine,
  Plus,
} from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'Epilepsy' },
  { icon: Brain, label: 'Migraine & Headache' },
  { icon: Activity, label: 'Stroke & Paralysis' },
  { icon: Move, label: "Parkinson's Disease" },
  { icon: Waves, label: 'Vertigo & Giddiness' },
  { icon: HeartPulse, label: 'Neck & Back Pain' },
  { icon: ScanLine, label: 'Memory & Cognitive' },
  { icon: Plus, label: 'More' },
];

export default function FeatureStrip() {
  return (
    <section className="bg-white border-y border-slate-100">
      {/* Mobile: 4-col icon grid */}
      <div className="md:hidden py-6 px-4">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center text-brand-600 ring-1 ring-brand-200/50">
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
              <p className="text-[11px] font-medium leading-tight text-slate-600 line-clamp-2">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: strip */}
      <div className="hidden md:block overflow-hidden">
        <div className="flex justify-center">
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <div
              key={`${label}-${i}`}
              className="flex shrink-0 items-center gap-2.5 px-6 py-5 border-r border-slate-100 last:border-r-0"
            >
              <div className="size-10 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center text-brand-600 ring-1 ring-brand-200/50">
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-medium text-slate-700 whitespace-nowrap">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
