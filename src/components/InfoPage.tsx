import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <div>
      <section className="bg-gradient-soft">
        <div className="container-shop max-w-4xl py-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-electric">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>
        </div>
      </section>
      <div className="container-shop max-w-4xl py-10 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export const infoHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} — ShopSphere` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — ShopSphere` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
