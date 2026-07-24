import { PortfolioApp } from "@/components/portfolio/PortfolioApp";

export const metadata = {
  title: "Portfolio · Collection",
  description:
    "Track your sneaker collection across devices. See market asks vs what you paid.",
  alternates: { canonical: "/collection/portfolio" },
};

export default function CollectionPortfolioPage() {
  return <PortfolioApp />;
}
