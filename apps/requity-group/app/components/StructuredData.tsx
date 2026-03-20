export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "Requity Group",
    url: "https://requitygroup.com",
    logo: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg",
    description:
      "Vertically integrated real estate investment and lending firm specializing in value-add properties across the United States.",
    foundingDate: "2020",
    founder: {
      "@type": "Person",
      name: "Dylan Marma",
      jobTitle: "CEO",
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    serviceType: [
      "Real Estate Investment",
      "Bridge Lending",
      "Property Management",
      "Real Estate Acquisition",
    ],
    knowsAbout: [
      "Commercial Real Estate",
      "Residential Real Estate",
      "Bridge Loans",
      "Value-Add Real Estate",
      "Manufactured Housing",
      "Multifamily Properties",
    ],
    email: "contact@requitygroup.com",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
