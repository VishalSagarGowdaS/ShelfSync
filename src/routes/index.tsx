import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, Banknote, Flame, RotateCcw, ShieldCheck, Sparkles, Trophy, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRail } from "@/components/product/ProductRail";
import { Countdown } from "@/components/home/Countdown";
import { CATEGORIES } from "@/lib/categories";
import { media } from "@/data/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopSphere — Discover More. Shop Smarter." },
      { name: "description", content: "Explore thousands of products across electronics, fashion, home, grocery, beauty and sports at amazing prices, delivered to your doorstep." },
      { property: "og:title", content: "ShopSphere — Discover More. Shop Smarter." },
      { property: "og:description", content: "Everything You Need. One Shopping Destination." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const perks = [
  { icon: Truck, title: "Free delivery", text: "On orders over ₹499" },
  { icon: Banknote, title: "Cash on Delivery", text: "Pay when it arrives" },
  { icon: RotateCcw, title: "Easy returns", text: "7-day return window" },
  { icon: ShieldCheck, title: "Genuine products", text: "Quality checked" },
];

function HomePage() {
  return (
    <>
      <section className="container-shop pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-navy-foreground shadow-card-hover">
          <img src={media.hero} alt="Headphones, smartwatch, sneakers and skincare arranged on navy pedestals" className="absolute inset-0 size-full object-cover object-right opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
          <div className="relative flex min-h-[420px] flex-col justify-center gap-6 px-6 py-14 sm:px-12 lg:min-h-[500px] lg:max-w-2xl lg:px-16">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-navy-foreground/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 text-warning" /> Mega Savings Week · up to 70% off
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Discover More.
              <br />
              <span className="text-gradient-brand brightness-150">Shop Smarter.</span>
            </h1>
            <p className="max-w-lg text-base text-navy-foreground/80 sm:text-lg">
              Explore thousands of products at amazing prices, delivered to your doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="brand" size="xl" asChild>
                <Link to="/search">
                  Shop Now <ArrowRight />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/deals">
                  <BadgePercent /> Explore Deals
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-electric">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shop mt-14">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Shop by category</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everything you need, beautifully organised.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              <img src={c.imageUrl} alt={c.name} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-navy-foreground">
                <h3 className="font-bold leading-tight">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-navy-foreground/80 transition-all group-hover:gap-2">
                  Shop now <ArrowRight className="size-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductRail title="Trending Products" subtitle="What everyone is adding to cart right now" section="trending" icon={<Flame className="size-6 text-deal" />} />
      <ProductRail title="Best Sellers" subtitle="Our most-loved products across India" section="bestsellers" icon={<Trophy className="size-6 text-warning" />} />

      <section className="container-shop mt-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-promo text-navy-foreground">
          <img src={media.promo} alt="Gift boxes with a speaker, perfume and running shoes" loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover md:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-navy via-navy/70 to-transparent md:block" />
          <div className="relative flex flex-col gap-5 p-8 sm:p-12 md:max-w-xl">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-deal px-3 py-1 text-xs font-bold text-deal-foreground">
              <Zap className="size-3.5" /> LIMITED-TIME OFFER
            </span>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Lightning Deals end at midnight</h2>
            <p className="text-navy-foreground/80">Extra savings on our deepest-discounted products. Once the timer runs out, prices go back up.</p>
            <Countdown />
            <Button variant="hero" size="xl" className="w-fit" asChild>
              <Link to="/deals">
                Grab the deals <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ProductRail title="Today's Deals" subtitle="Biggest discounts of the day" section="deals" icon={<BadgePercent className="size-6 text-success" />} />
      <ProductRail title="Recommended for You" subtitle="Top-rated picks we think you'll love" section="recommended" icon={<Sparkles className="size-6 text-violet" />} />
      <ProductRail title="Recently Added" subtitle="Fresh arrivals in the store" section="new" icon={<Zap className="size-6 text-electric" />} />
    </>
  );
}
