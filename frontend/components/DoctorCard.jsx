import Link from 'next/link';
import Image from 'next/image';
import { FiStar } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';

export default function DoctorCard({ doctor }) {
  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className="group relative block bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/5"
    >
      <div className="relative w-full aspect-[3/4] bg-brand-50">
        {typeof doctor.photo_url === 'string' && doctor.photo_url.trim() ? (
          <Image
            src={doctor.photo_url}
            alt={doctor.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-brand-gradient text-white">
            <FaBrain className="text-5xl opacity-90" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {doctor.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow">
            <FiStar className="fill-amber-500 text-amber-500 w-3 h-3" /> {doctor.rating}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-slate-900">{doctor.name}</h3>
        <p className="text-sm text-slate-500 mb-1">{doctor.qualification}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-brand-600 font-medium truncate">{doctor.specialization}</p>
          {!!doctor.consultation_fee && (
            <span className="shrink-0 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
              ₹{doctor.consultation_fee}
            </span>
          )}
        </div>
      </div>

      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-600 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}