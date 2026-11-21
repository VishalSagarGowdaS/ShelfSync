import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_CATEGORIES } from "@/lib/categories";

const linkCls = "text-sm text-navy-foreground/70 transition-colors hover:text-navy-foreground";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="container-shop grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm text-navy-foreground/70">
            Everything You Need. One Shopping Destination. Thousands of products at great prices, delivered across India.
          </p>
          <div className="mt-6 flex gap-2">
            {[
              { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
              { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
              { icon: Twitter, label: "X (Twitter)", href: "https://x.com" },
              { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
              { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-9 place-items-center rounded-lg bg-navy-foreground/10 transition hover:bg-navy-foreground/20">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            {NAV_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className={linkCls}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Help</h3>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/support" className={linkCls}>Customer Support</Link></li>
            <li><Link to="/faq" className={linkCls}>FAQs</Link></li>
            <li><Link to="/contact" className={linkCls}>Contact Us</Link></li>
            <li><Link to="/account" className={linkCls}>Track your order</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Company</h3>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/about" className={linkCls}>About ShopSphere</Link></li>
            <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkCls}>Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container-shop flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
          <p>Cash on Delivery available across India · Free delivery over ₹499</p>
        </div>
      </div>
    </footer>
  );
}
