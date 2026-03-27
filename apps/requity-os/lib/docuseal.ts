import { DocusealApi } from "@docuseal/api";

const docuseal = new DocusealApi({
  key: process.env.DOCUSEAL_API_KEY ?? "",
  url: process.env.DOCUSEAL_API_URL || "https://api.docuseal.com",
});

export default docuseal;
