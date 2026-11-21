import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { parseCatalogSearch, type CatalogSearch } from "@/lib/search-params";

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): CatalogSearch => parseCatalogSearch(raw),
  head: () => ({
    meta: [
      { title: "Search products — ShopSphere" },
      { name: "description", content: "Search thousands of products with typo-tolerant search, filters and sorting on ShopSphere." },
      { property: "og:title", content: "Search products — ShopSphere" },
      { property: "og:description", content: "Find exactly what you need with smart, typo-tolerant search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div className="container-shop py-8">
      <h1 className="mb-6 text-3xl font-extrabold">{search.q ? `Results for “${search.q}”` : "All products"}</h1>
      <CatalogBrowser search={search} onChange={(next) => navigate({ search: next })} />
    </div>
  );
}
