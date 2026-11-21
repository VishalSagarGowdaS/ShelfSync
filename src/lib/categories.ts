import { seedCategories } from "@/data/catalog";

/** Static category navigation (same slugs as the backend `categories` table seed). */
export const CATEGORIES = seedCategories.map((c) => ({ slug: c.slug, name: c.name, imageUrl: c.imageUrl, description: c.description }));

export const NAV_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "electronics", label: "Electronics" },
  { slug: "fashion", label: "Fashion" },
  { slug: "home-kitchen", label: "Home & Kitchen" },
  { slug: "grocery", label: "Grocery" },
  { slug: "beauty", label: "Beauty" },
  { slug: "sports", label: "Sports" },
];

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
