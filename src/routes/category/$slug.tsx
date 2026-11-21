import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { parseCatalogSearch, type CatalogSearch } from "@/lib/search-params";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (raw: Record<string, unknown>): CatalogSearch => {
    const s = parseCatalogSearch(raw);
    delete s.category;
    return s;
  },
  loader: ({ params }) => {
    const category = CATEGORIES.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    const desc = loaderData ? `${loaderData.category.description}. Shop ${name} at the best prices on ShopSphere.` : "Shop by category on ShopSphere.";
    return {
      meta: [
        { title: `${name} — ShopSphere` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} — ShopSphere` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <img src={category.imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />
        <div className="container-shop relative py-12">
          <nav className="flex items-center gap-1 text-xs text-navy-foreground/70" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-navy-foreground">Home</Link>
            <ChevronRight className="size-3" />
            <span>{category.name}</span>
          </nav>
          <h1 className="mt-3 text-4xl font-extrabold">{category.name}</h1>
          <p className="mt-2 max-w-xl text-navy-foreground/80">{category.description}</p>
        </div>
      </section>
      <div className="container-shop py-8">
        <CatalogBrowser search={search} fixedCategory={category.slug} onChange={(next) => navigate({ search: next })} />
      </div>
    </>
  );
}
