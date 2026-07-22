import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Syne } from "next/font/google";
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
  title: "SneakerPulse — StockX market views",
  description:
    "Live StockX-style market views for tracked sneakers: price, change, volume, chart, and size asks.",
  openGraph: {
    title: "SneakerPulse — StockX market views",
    description:
      "TradingView and CoinMarketCap–inspired sneaker markets powered by live StockX data.",
    siteName: "SneakerPulse",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
