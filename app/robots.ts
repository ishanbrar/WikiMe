import type { MetadataRoute } from "next";
import { CANONICAL_APP_URL } from "@/lib/appUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/article",
        "/login",
        "/signup",
        "/api/",
      ],
    },
    sitemap: `${CANONICAL_APP_URL}/sitemap.xml`,
    host: CANONICAL_APP_URL,
  };
}
