import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Package, RotateCcw, Truck } from "lucide-react";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/support")({
  head: () => infoHead("Customer Support", "Help with orders, delivery, Cash on Delivery payments and returns at ShopSphere."),
  component: () => (
    <InfoPage eyebrow="Help centre" title="How can we help?" intro="Find quick answers about orders, delivery, payments and returns.">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Package, t: "Track an order", d: "See live status for every order in your account.", to: "/account" as const },
          { icon: Truck, t: "Delivery", d: "Orders arrive in 3–5 days. Free over ₹499, otherwise ₹49.", to: "/faq" as const },
          { icon: Banknote, t: "Cash on Delivery", d: "Pay in cash or UPI when your order is delivered.", to: "/faq" as const },
          { icon: RotateCcw, t: "Returns", d: "Return most items within 7 days of delivery.", to: "/terms" as const },
        ].map(({ icon: Icon, t, d, to }) => (
          <Link key={t} to={to} className="rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <Icon className="size-6 text-electric" />
            <p className="mt-3 font-bold text-foreground">{t}</p>
            <span className="mt-1 block text-sm text-muted-foreground">{d}</span>
          </Link>
        ))}
      </div>
      <h2>Still need help?</h2>
      <p>Our support team is available 9 AM – 9 PM, every day. <Link to="/contact" className="font-semibold text-electric">Contact us</Link> and we'll get back to you within one business day.</p>
    </InfoPage>
  ),
});
