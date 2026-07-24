import {
  BRAND_BLURB,
  BRAND_NAME,
  FOUNDER_NAME,
  siteUrl,
} from "@/lib/brand";

/** Organization + WebSite JSON-LD for the homepage. */
export function SiteJsonLd() {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: BRAND_NAME,
        url: base,
        description: BRAND_BLURB,
        founder: {
          "@type": "Person",
          name: FOUNDER_NAME,
        },
        logo: {
          "@type": "ImageObject",
          url: `${base}/og.png?v=2`,
        },
        image: `${base}/og.png?v=2`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: BRAND_NAME,
        description: BRAND_BLURB,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ProductJsonLd(input: {
  name: string;
  slug: string;
  brand: string;
  image?: string;
  sku?: string;
  price?: number | null;
  stockxUrl?: string;
}) {
  const base = siteUrl();
  const url = `${base}/sneakers/${input.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    sku: input.sku,
    brand: {
      "@type": "Brand",
      name: input.brand,
    },
    image: input.image ? [input.image] : undefined,
    url,
    offers:
      input.price != null && input.price > 0
        ? {
            "@type": "Offer",
            priceCurrency: "USD",
            price: input.price,
            availability: "https://schema.org/InStock",
            url: input.stockxUrl || url,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
