import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiHeart,
  FiCreditCard,
  FiTag,
  FiPackage,
  FiTool,
  FiFileText,
  FiStar,
  FiSettings,
  FiSearch,
  FiBarChart2,
  FiSmartphone,
  FiImage,
  FiUserPlus,
} from "react-icons/fi";

const NAV = [
  { to: "/", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/appointments", label: "Appointments", icon: FiCalendar },

  { to: "/doctors", label: "Doctors", icon: FiUsers },
  { to: "/clinics", label: "Clinics", icon: FiMapPin },
  { to: "/services", label: "Services", icon: FiBriefcase },
  { to: "/new-patients", label: "Old Patients", icon: FiHeart },
  { to: "/new-appointments", label: "Old Appointments", icon: FiHeart },

  { to: "/patients", label: "Patients", icon: FiHeart },
  { to: "/payments", label: "Payments", icon: FiCreditCard },
  { to: "/coupons", label: "Coupons & Offers", icon: FiTag },
  { to: "/medicines", label: "Medicines", icon: FiPackage },
  { to: "/equipment", label: "Equipment", icon: FiTool },
  { to: "/blogs", label: "Blogs", icon: FiFileText },
  { to: "/receptionists", label: "Receptionists", icon: FiUserPlus },

  { to: "/reviews", label: "Reviews", icon: FiStar },
  { to: "/hero-banners", label: "Hero Banners", icon: FiImage },
  { to: "/onboarding-slides", label: "App Onboarding", icon: FiSmartphone },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  { to: "/settings", label: "Settings & SEO", icon: FiSettings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-brand-900 text-white min-h-screen sticky top-0 hidden lg:flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="font-bold text-lg leading-tight">DHIC Admin</p>
        <p className="text-xs text-brand-200">
          Neurocare Clinic
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-brand-100 hover:bg-white/10"
              }`
            }
          >
            <item.icon className="text-lg shrink-0" /> {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
