import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import JsonLd from "@/components/JsonLd";
import { getSettings } from "@/lib/api";
import { clinicSchema, SITE_URL } from "@/lib/schema";

export const viewport = { themeColor: "#11417e" };

export async function generateMetadata() {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default:
        "Neurocare Clinic | Dr Neeraj Kumar - Senior Consultant Neurologist in Vasant Kunj, New Delhi",
      template: "%s | Neurocare Clinic",
    },
    description:
      "Expert neurology care in Vasant Kunj, New Delhi by Dr Neeraj Kumar, Senior Consultant Neurologist. Migraine, epilepsy, stroke, Parkinson's disease, nerve disorders, back pain, memory problems and vertigo. Book your appointment today.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: "Neurocare Clinic",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
      shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
  };
}

export default async function RootLayout({ children }) {
  const settingsRes = await getSettings();
  const settings = settingsRes?.settings || {};

  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-800">
        <JsonLd data={clinicSchema(settings)} />
        <Header settings={settings} />
        <main>{children}</main>
        <Footer settings={settings} />
        <FloatingButtons settings={settings} />
      </body>
    </html>
  );
}
