import { FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { CLINIC } from '@/lib/clinic';

export default function FloatingButtons({ settings = {} }) {
  const phone = settings.phone || CLINIC.phone;
  const whatsapp = settings.whatsapp || CLINIC.whatsapp;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg text-2xl"
      >
        <FaWhatsapp />
      </a>
      <a
        href={`tel:+91${phone}`}
        aria-label="Call Now"
        className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg text-xl"
      >
        <FiPhone />
      </a>
    </div>
  );
}
