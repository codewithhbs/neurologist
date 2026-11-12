
import Link from "next/link";
import Image from "next/image";
import { FaBrain } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

/**
 * Handles full image URLs and relative upload paths.
 */
function getImageUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;

  const value = url.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_URL}/${value.replace(/^\/+/, "")}`;
}

export default function ServiceCard({ service, index = 0 }) {
  const img = getImageUrl(
    service.banner_image_url || service.icon_url
  );

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-[#2F6FC6]/10 bg-white shadow-[0_8px_30px_rgba(47,111,198,0.06)] transition-all duration-500 hover:-translate-y-2 hover:border-[#2F6FC6]/30 hover:shadow-[0_20px_45px_rgba(47,111,198,0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F6FC6]"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >

      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAF2FC]">

        {img ? (
          <Image
            src={img}
            alt={service.name || "Neurology treatment"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#EAF2FC] to-[#D7E8FF]">
            <FaBrain
              size={55}
              className="text-[#2F6FC6]/50"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 to-transparent opacity-70" />

      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">

        <div className="flex items-start gap-3">

          {/* Medical Icon */}
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#EAF2FC] text-[#2F6FC6] transition-all duration-300 group-hover:bg-[#2F6FC6] group-hover:text-white">
            <FaBrain size={21} aria-hidden="true" />
          </div>

          {/* Title and Description */}
          <div className="min-w-0 flex-1">

            <h3 className="text-[15px] font-extrabold leading-snug text-slate-900 transition-colors duration-300 group-hover:text-[#2F6FC6] sm:text-base">
              {service.name}
            </h3>

            {service.short_description && (
              <p className="mt-2 line-clamp-2 text-[12px] leading-[1.65] text-slate-600 sm:text-[13px]">
                {service.short_description}
              </p>
            )}

          </div>
        </div>

        {/* View Details */}
        <div className="mt-auto pl-[60px] pt-4">
          <span className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-[13px] font-bold text-[#2F6FC6] transition-all duration-300 group-hover:border-[#2F6FC6]">
            View Details
            <FiArrowRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-1.5"
              aria-hidden="true"
            />
          </span>
        </div>

      </div>

    </Link>
  );
}
