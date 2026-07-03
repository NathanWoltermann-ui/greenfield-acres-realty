// Public endpoint (/api/featured): serves the cached featured listings.
// Priority: Netlify Blobs cache → live refresh (first call after the API key
// is configured) → bundled fallback snapshot so the site always renders.

import { readFeatured, refreshFeatured } from "./lib/idx.mts";
import fallback from "../../data/featured-fallback.json";

export default async () => {
  let data = null;
  try {
    data = await readFeatured();
    if (!data) data = await refreshFeatured();
  } catch (err) {
    console.error("featured: falling back —", err);
  }
  if (!data) data = fallback;

  return Response.json(data, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600",
      "access-control-allow-origin": "*",
    },
  });
};

export const config = {
  path: "/api/featured",
};
