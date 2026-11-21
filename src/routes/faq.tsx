import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => infoHead("Frequently Asked Questions", "Answers to common questions about ordering, delivery, payments and returns at ShopSphere."),
  component: FaqPage,
});

const faqs = [
  { q: "How much does delivery cost?", a: "Delivery is free on orders of ₹499 or more. Below that, a flat ₹49 delivery charge applies." },
  { q: "Which payment methods do you accept?", a: "We currently accept Cash on Delivery. You can pay the delivery agent in cash or by UPI." },
  { q: "Why is my order showing 'Processing'?", a: "Every order is checked against live stock before it is confirmed. This usually takes a few seconds. If an item sold out in the meantime, the order is rejected and you are not charged." },
  { q: "Can two people buy the last item at the same time?", a: "No. Stock is reserved safely, so only one order can claim the last unit. The other order is rejected with a clear message." },
  { q: "How do I return a product?", a: "Most products can be returned within 7 days of delivery. Contact support with your order number to start a return." },
  { q: "Is my cart saved?", a: "Yes. When you're signed in, your cart is saved to your account and is still there after you refresh or sign in again." },
];

function FaqPage() {
  return (
    <InfoPage eyebrow="FAQ" title="Frequently asked questions" intro="Everything you need to know about shopping with ShopSphere.">
      <Accordion type="single" collapsible className="rounded-2xl border bg-card px-6 shadow-card">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`q${i}`}>
            <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </InfoPage>
  );
}
