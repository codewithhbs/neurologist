import Link from "next/link";
import Image from "next/image";
import { FaBrain } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

/**
 * The API already returns full image URLs (API_IMAGE_URL + path).
 * This only guards against bad data: relative paths and doubled bases such as
 * http://localhost:5000/http://localhost:5000/uploads/x.jpg
 */
function getImageUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  let value = url.trim();

  while (/^https?:\/\/[^/]+\/https?:\/\//i.test(value)) {
    value = value.replace(/^https?:\/\/[^/]+\//i, "");
  }

  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}/${value.replace(/^\/+/, "")}`;
}

export default function ServiceCard({ service }) {
  const img = getImageUrl(service.banner_image_url || service.icon_url);

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition duration-300 hover:ring-brand-600/40 hover:shadow-lg hover:shadow-brand-600/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {/* image */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-brand-50">
        {img ? (
          <Image
            src={img}
            alt={service.name || "Service image"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 to-accent-50 text-4xl text-brand-500/60">
            <FaBrain aria-hidden="true" />
          </div>
        )}
      </div>

      {/* text */}
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600 sm:text-base">
          {service.name}
        </h3>

        {service.short_description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
            {service.short_description}
          </p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-brand-600 sm:text-[13px]">
          View details
          <FiArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}