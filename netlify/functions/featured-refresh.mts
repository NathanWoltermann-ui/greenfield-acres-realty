// Scheduled daily: refreshes the featured-listings cache from the IDX Broker
// API. Because only ACTIVE listings survive the refresh, this is also the
// automatic "is that featured home still on the market?" check — sold or
// expired listings drop off the site within a day.
//
// Requires env var IDX_API_KEY (IDX Broker dashboard → Developers → API key).

import { refreshFeatured } from "./lib/idx.mts";

export default async () => {
  try {
    const data = await refreshFeatured();
    if (!data) {
      console.warn("featured-refresh: IDX_API_KEY not set — site will keep using fallback data.");
      return new Response("IDX_API_KEY not configured", { status: 200 });
    }
    return Response.json({ ok: true, homes: data.homes.length, land: data.land.length });
  } catch (err) {
    console.error("featured-refresh failed:", err);
    return new Response(String(err), { status: 502 });
  }
};

export const config = {
  schedule: "@daily",
};
