import { FiStar } from 'react-icons/fi';

export default function TestimonialCard({ review }) {
  return (
    <div className="card p-6">
      <div className="flex gap-0.5 text-amber-400 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar key={i} className={i < review.rating ? 'fill-amber-400' : 'text-slate-200'} />
        ))}
      </div>
      <p className="text-slate-600 text-sm mb-4 line-clamp-4">"{review.review_text}"</p>
      <p className="font-semibold text-slate-900">— {review.patient_name}</p>
    </div>
  );
}
