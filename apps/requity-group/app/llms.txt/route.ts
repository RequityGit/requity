import { supabase } from "../../lib/supabase";

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  // Fetch published blog posts for the content index
  const { data: posts } = await supabase
    .from("site_insights")
    .select("title, slug, excerpt, tags, audience, category, published_date")
    .eq("status", "published")
    .eq("is_published", true)
    .order("published_date", { ascending: false });

  const blogIndex = (posts ?? [])
    .map(
      (p) =>
        `- [${p.title}](https://requitygroup.com/insights/${p.slug}): ${p.excerpt || ""}`
    )
    .join("\n");

  const content = `# Requity Group

> Vertically integrated real estate investment and lending platform.

Requity Group acquires, operates, and lends on value-add real estate across the United States. Founded by Dylan Marma, the firm has deployed over $70M in investor capital across bridge lending and direct equity investments.

## What We Do

### Requity Lending (Bridge Loans)
Requity Lending provides short-term bridge loans for commercial and residential real estate at 12% interest-only. Loan sizes range from $250K to $10M. Closings in as few as 10 business days. We specialize in:
- Commercial bridge loans (multifamily, mixed-use, retail)
- Manufactured housing community / mobile home park financing
- Fix-and-flip loans for residential investors
- Ground-up construction financing
- Portfolio acquisition financing

Bridge loans are 12% interest-only with 12-24 month terms. We underwrite to the business plan, not just trailing financials. Term sheets delivered within 48 hours.

Apply: https://requitygroup.com/lending/apply
Learn more: https://requitygroup.com/lending

### Requity Investments (Fund Management)
Requity Group manages investment funds for accredited investors seeking exposure to private real estate. Strategies include:
- Value-add equity investments (net to investor IRR 14-17%), debt (10-12%)
- Bridge lending fund (target 8-12% yield, asset-backed)
- Manufactured housing community acquisitions
- Monthly distributions, $50K minimum investment
- $1M GP first-loss position for investor alignment

Request investor materials: https://requitygroup.com/invest/request-access
Learn more: https://requitygroup.com/invest

## Key Facts
- Founded: 2020
- Headquarters: United States
- Capital deployed: $70M+
- Focus sectors: Bridge lending, manufactured housing, multifamily, value-add real estate
- CEO: Dylan Marma
- Website: https://requitygroup.com
- Lending site: https://requitylending.com
- Investor portal: https://portal.requitygroup.com

## Contact
- General: contact@requitygroup.com
- Lending inquiries: https://requitygroup.com/lending/apply
- Investor inquiries: https://requitygroup.com/invest/request-access

## Pages
- [Home](https://requitygroup.com/)
- [About](https://requitygroup.com/about)
- [Lending](https://requitygroup.com/lending)
- [Manufactured Housing & Mobile Home Park Financing](https://requitygroup.com/lending/manufactured-housing)
- [Small Bay Industrial & Flex Space Financing](https://requitygroup.com/lending/small-bay-industrial)
- [Industrial Outdoor Storage (IOS) Financing](https://requitygroup.com/lending/industrial-outdoor-storage)
- [RV Park & Campground Financing](https://requitygroup.com/lending/rv-parks)
- [Multifamily & Apartment Building Financing](https://requitygroup.com/lending/multifamily)
- [Commercial Bridge Loans: Self Storage & Retail](https://requitygroup.com/lending/commercial-bridge)
- [Guarantor Support: Balance Sheet & Experience Partners](https://requitygroup.com/lending/guarantor-support)
- [Transactional Funding for Wholesalers](https://requitygroup.com/lending/transactional-funding)
- [Apply for a Loan](https://requitygroup.com/lending/apply)
- [Invest](https://requitygroup.com/invest)
- [Request Investor Access](https://requitygroup.com/invest/request-access)
- [Fund](https://requitygroup.com/fund)
- [Portfolio](https://requitygroup.com/portfolio)
- [Testimonials](https://requitygroup.com/testimonials)
- [Insights (Blog)](https://requitygroup.com/insights)

## Recent Insights
${blogIndex}

## Frequently Asked Questions

### Bridge Lending
Q: How fast can Requity close a bridge loan?
A: As few as 10 business days from signed term sheet to funding.

Q: What is the interest rate on Requity bridge loans?
A: 12% interest-only. Terms are standardized for speed and certainty.

Q: What property types does Requity Lending finance?
A: Commercial real estate (multifamily, mixed-use, retail, industrial), manufactured housing communities, mobile home parks, residential fix-and-flip, and ground-up construction.

Q: What is the loan size range?
A: $250K to $10M.

Q: Does Requity finance mobile home parks?
A: Yes. Manufactured housing communities are one of our most active lending categories. We finance acquisitions, including parks with park-owned homes, and structure improvement holdbacks for value-add execution.

Q: What LTV does Requity lend to?
A: Up to 75-80% of purchase price depending on property type and borrower experience.

### Investing
Q: What is the minimum investment with Requity Group?
A: $50,000 is the typical minimum for deal-by-deal investments, while $100,000 is the typical minimum for fund investments. Fund investments are generally restricted to accredited investors. Deal-by-deal opportunities may be available to non-accredited investors who qualify under Rule 506(b).

Q: What returns does Requity target?
A: Net to investor IRR of 14-17% for value-add equity investments, 10-12% for debt.

Q: Are investments asset-backed?
A: Yes. Bridge lending fund investments are secured by first-position liens on real property. Equity investments are backed by the underlying real estate assets.

Q: How often are distributions paid?
A: All of Requity's investment vehicles target to pay monthly distributions.

Q: Does Requity have skin in the game?
A: Yes. The GP maintains a $1M first-loss position in the lending fund, meaning management capital absorbs losses before investor capital.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
