import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { InfoPage, infoHead } from "@/components/InfoPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_RE } from "@/lib/validation";

export const Route = createFileRoute("/contact")({
  head: () => infoHead("Contact Us", "Get in touch with the ShopSphere team by email or phone."),
  component: ContactPage,
});

const SUPPORT_EMAIL = "support@shopsphere.in";

function ContactPage() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  return (
    <InfoPage eyebrow="Contact" title="We'd love to hear from you" intro="Questions about an order, a product or partnering with us? Reach out — we reply within one business day.">
      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          {[
            { icon: Mail, t: "Email", d: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
            { icon: Phone, t: "Phone", d: "1800-123-4567 (toll free)", href: "tel:18001234567" },
            { icon: MapPin, t: "Office", d: "Koramangala, Bengaluru 560034", href: undefined },
          ].map(({ icon: Icon, t, d, href }) => (
            <div key={t} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-card">
              <Icon className="mt-0.5 size-5 text-electric" />
              <div>
                <p className="text-sm font-semibold">{t}</p>
                {href ? <a href={href} className="text-sm text-electric hover:underline">{d}</a> : <span className="text-sm text-muted-foreground">{d}</span>}
              </div>
            </div>
          ))}
        </div>
        <form
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (f.name.trim().length < 2 || !EMAIL_RE.test(f.email.trim()) || f.message.trim().length < 10) {
              toast.error("Please enter your name, a valid email and a message of at least 10 characters");
              return;
            }
            const body = encodeURIComponent(`${f.message}\n\n— ${f.name} (${f.email})`);
            window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("ShopSphere enquiry")}&body=${body}`;
            toast.success("Opening your email app to send the message");
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="c-name">Name</Label><Input id="c-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-msg">Message</Label><Textarea id="c-msg" rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
          <Button type="submit" variant="brand">Send message</Button>
        </form>
      </div>
    </InfoPage>
  );
}
