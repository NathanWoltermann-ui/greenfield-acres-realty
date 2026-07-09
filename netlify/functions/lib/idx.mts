// Shared IDX Broker helpers: fetch Aimee's featured listings, keep only
// ACTIVE ones, normalize the fields we render, split homes ($800k+ site
// policy) from land, and cache in Netlify Blobs.

import { getStore } from "@netlify/blobs";

export const MIN_HOME_PRICE = 800_000;
const MAX_PER_GROUP = 12;
const IDX_BASE = "https://greenfieldacresrealty.idxbroker.com";

const digits = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const firstImage = (image: any): string | null => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (image.url) return image.url;
  const first = image["0"] ?? Object.values(image).find((v: any) => v && typeof v === "object" && v.url);
  return first?.url ?? null;
};

const normalize = (raw: any) => {
  const price = digits(raw.listingPrice ?? raw.listPrice ?? raw.price);
  let url: string | null = raw.fullDetailsURL ?? null;
  if (!url && raw.detailsURL) {
    url = raw.detailsURL.startsWith("http") ? raw.detailsURL : `https://${raw.detailsURL}`;
  }
  if (!url && raw.listingID && raw.idxID) {
    url = `${IDX_BASE}/idx/details/listing/${raw.idxID}/${raw.listingID}`;
  }
  return {
    id: raw.listingID ?? raw.id ?? null,
    address: raw.address ?? raw.displayAddress ?? "High Country property",
    city: raw.cityName ?? "",
    state: raw.state ?? "NC",
    price,
    priceDisplay: price ? "$" + price.toLocaleString("en-US") : "Call for details",
    beds: digits(raw.bedrooms),
    baths: digits(raw.totalBaths ?? raw.fullBaths),
    sqft: digits(raw.sqFt ?? raw.sqft),
    acres: digits(raw.acres),
    image: firstImage(raw.image),
    url,
    status: raw.propStatus ?? raw.idxStatus ?? "",
    propType: raw.idxPropType ?? raw.propType ?? "",
  };
};

export type Listing = ReturnType<typeof normalize>;
export type FeaturedData = { updated: string; source: string; homes: Listing[]; land: Listing[] };

/** All 13 High Country town city IDs (HCAR MLS via IDX) — keep in sync with src/data/communities.json */
const CITY_IDS = [44011, 4531, 4970, 2514, 3263, 23215, 50899, 25565, 25731, 17983, 36728, 39655, 11036];

async function idxGet(path: string, apiKey: string, params?: URLSearchParams): Promise<any[]> {
  const headers: Record<string, string> = { accesskey: apiKey, outputtype: "json", apiversion: "1.8.0" };
  const ancillary = process.env.IDX_ANCILLARY_KEY;
  if (ancillary) headers.ancillarykey = ancillary;

  const url = `https://api.idxbroker.com${path}${params ? `?${params}` : ""}`;
  const res = await fetch(url, { headers });
  if (res.status === 204) return []; // valid key, no matching data
  if (!res.ok) throw new Error(`IDX API ${path} responded ${res.status}`);
  const payload = await res.json().catch(() => null);
  return Array.isArray(payload) ? payload : Object.values(payload ?? {});
}

/** MLS-wide premium search — used when the account has no own featured listings. */
async function searchPremium(apiKey: string, propertyType: string, minPrice?: number): Promise<any[]> {
  if (!process.env.IDX_ANCILLARY_KEY) return [];
  const params = new URLSearchParams();
  params.set("ccz", "city");
  CITY_IDS.forEach((id) => params.append("city[]", String(id)));
  params.set("pt", propertyType);
  if (minPrice) params.set("lp", String(minPrice));
  params.set("srt", "prd");
  params.set("per", "25");
  return idxGet("/clients/searchquery", apiKey, params);
}

export async function refreshFeatured(): Promise<FeaturedData | null> {
  const apiKey = process.env.IDX_API_KEY;
  if (!apiKey) return null;

  // 1st choice: Aimee's own featured listings; otherwise premium homes + land across the whole MLS
  let rows = await idxGet("/clients/featured", apiKey);
  let source = "idx";
  if (!rows.length) {
    rows = [
      ...(await searchPremium(apiKey, "1", MIN_HOME_PRICE)),
      ...(await searchPremium(apiKey, "6")),
    ];
    source = "idx-mls";
  }
  if (!rows.length) return null;

  const active = rows
    .map(normalize)
    .filter((l) => /active/i.test(l.status) && !/contract|pending|sold|closed/i.test(l.status));

  const isLand = (l: Listing) =>
    /land|lots?|acreage|farm/i.test(l.propType) || (!l.beds && !l.sqft && (l.acres ?? 0) > 0);

  const homes = active
    .filter((l) => !isLand(l) && (l.price ?? 0) >= MIN_HOME_PRICE)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, MAX_PER_GROUP);

  const land = active
    .filter(isLand)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, MAX_PER_GROUP);

  if (!homes.length && !land.length) return null;

  const data: FeaturedData = { updated: new Date().toISOString(), source, homes, land };
  await getStore("listings").setJSON("featured", data);

  console.log(`idx refresh (${source}): cached ${homes.length} homes, ${land.length} land (of ${rows.length} rows, ${active.length} active).`);
  return data;
}

export async function readFeatured(): Promise<FeaturedData | null> {
  return (await getStore("listings").get("featured", { type: "json" })) as FeaturedData | null;
}
