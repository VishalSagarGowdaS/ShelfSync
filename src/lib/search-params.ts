import type { SortOption } from "@/lib/types";

export interface CatalogSearch {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  minRating?: number;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
}

const SORTS: SortOption[] = ["relevance", "price_asc", "price_desc", "popularity", "rating", "newest"];

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined);

/** Parses URL search params into a typed catalogue query, dropping anything invalid. */
export function parseCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {};
  const q = str(raw["q"]);
  if (q) out.q = q;
  const category = str(raw["category"]);
  if (category) out.category = category;
  const minPrice = num(raw["minPrice"]);
  if (minPrice !== undefined) out.minPrice = minPrice;
  const maxPrice = num(raw["maxPrice"]);
  if (maxPrice !== undefined) out.maxPrice = maxPrice;
  const city = str(raw["city"]);
  if (city) out.city = city;
  const minRating = num(raw["minRating"]);
  if (minRating !== undefined && minRating <= 5) out.minRating = minRating;
  if (raw["inStock"] === true || raw["inStock"] === "true") out.inStock = true;
  const sort = raw["sort"];
  if (typeof sort === "string" && (SORTS as string[]).includes(sort)) out.sort = sort as SortOption;
  const page = num(raw["page"]);
  if (page !== undefined && page >= 1) out.page = Math.floor(page);
  return out;
}

export const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  popularity: "Popularity",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Highest Rated",
  newest: "Newest Arrivals",
};
