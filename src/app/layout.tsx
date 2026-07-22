import type { Metadata } from "next";
import { Instrument_Sans, Syne } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Jordan 1 High Dark Mocha — SneakerPulse",
  description:
    "Live StockX market view for the Jordan 1 High Dark Mocha (2020): price, change, volume, chart, and statistics.",
  openGraph: {
    title: "Jordan 1 High Dark Mocha — SneakerPulse",
    description:
      "TradingView and CoinMarketCap–inspired sneaker market page powered by live StockX data.",
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
      className={`${instrument.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
