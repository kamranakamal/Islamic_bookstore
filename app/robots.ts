import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: [`${appUrl}/sitemap.xml`]
  };
}
