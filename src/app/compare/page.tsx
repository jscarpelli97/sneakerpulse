import { redirect } from "next/navigation";

export const metadata = {
  title: "Compare",
  description: "Multi-pair sneaker compare — now inside Markets.",
};

/** Compare lives in Markets as a board view. */
export default async function CompareRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; s?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ view: "compare" });
  if (params.s) {
    qs.set("s", params.s);
  } else {
    const slugs = [params.a, params.b].filter(Boolean) as string[];
    if (slugs.length) qs.set("s", slugs.join(","));
  }
  redirect(`/markets?${qs.toString()}`);
}
