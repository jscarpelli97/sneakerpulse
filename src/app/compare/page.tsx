import { redirect } from "next/navigation";

export const metadata = {
  title: "Compare",
  description: "Head-to-head sneaker compare — now inside Markets.",
};

/** Compare lives in Markets as a board view. */
export default async function CompareRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ view: "compare" });
  if (params.a) qs.set("a", params.a);
  if (params.b) qs.set("b", params.b);
  redirect(`/markets?${qs.toString()}`);
}
