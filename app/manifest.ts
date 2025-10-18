import type { MetadataRoute } from "next";

import { appUrl, organization } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: organization.name,
    short_name: "Maktab",
    description: organization.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0f766e",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ],
    id: appUrl
  };
}
