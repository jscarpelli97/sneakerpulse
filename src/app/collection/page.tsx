import { redirect } from "next/navigation";

export const metadata = {
  title: "Collection",
  description:
    "Your collection on SPI Markets — portfolio value and wardrobe fits, same account.",
  alternates: { canonical: "/collection" },
};

/** Default into Portfolio; Wardrobe is one tab over. */
export default function CollectionIndexPage() {
  redirect("/collection/portfolio");
}
