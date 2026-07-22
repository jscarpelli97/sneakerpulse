import { Cta } from "@/components/Cta";
import { Drops } from "@/components/Drops";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Pulse } from "@/components/Pulse";
import { Signal } from "@/components/Signal";
import { Ticker } from "@/components/Ticker";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Ticker />
        <Drops />
        <Signal />
        <Pulse />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
