import { WardrobeApp } from "@/components/wardrobe/WardrobeApp";

export const metadata = {
  title: "Wardrobe · Collection",
  description:
    "Closet and Fits — build outfits from your sneakers and custom pieces, synced to your account.",
  alternates: { canonical: "/collection/wardrobe" },
};

export default function CollectionWardrobePage() {
  return <WardrobeApp />;
}
