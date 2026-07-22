import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Syne } from "next/font/google";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { BRAND_NAME, BRAND_NAME_WITH_FORMER, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME_WITH_FORMER} — sneakers & streetwear asks`,
  description: BRAND_TAGLINE,
  applicationName: BRAND_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: `${BRAND_NAME_WITH_FORMER} — sneakers & streetwear asks`,
    description: `${BRAND_TAGLINE}. Formerly SneakerPulse.`,
    siteName: BRAND_NAME_WITH_FORMER,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${syne.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="dashboard flex min-h-full flex-col bg-dash-bg text-dash-text">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
