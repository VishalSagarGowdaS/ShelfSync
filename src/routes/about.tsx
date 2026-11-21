import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/about")({
  head: () => infoHead("About ShopSphere", "ShopSphere brings electronics, fashion, home, grocery, beauty and sports together in one shopping destination."),
  component: () => (
    <InfoPage eyebrow="About us" title="Everything you need, in one place" intro="ShopSphere is an Indian shopping destination built to make everyday shopping simple, fair and fast.">
      <h2>Our mission</h2>
      <p>We bring together trusted sellers from across India so you can find quality products at honest prices — from the latest earphones to your monthly groceries.</p>
      <h2>What makes us different</h2>
      <ul>
        <li>Real-time stock: what you see is what's actually available.</li>
        <li>Every order is checked against live inventory before it's confirmed.</li>
        <li>Cash on Delivery everywhere we ship, and free delivery over ₹499.</li>
        <li>Smart search that understands typos — try “bluetoth” or “headfone”.</li>
      </ul>
      <h2>Built for reliability</h2>
      <p>Orders, stock and search run on a dedicated platform with a relational database, an event stream and a search engine, so busy sale days never oversell the last item.</p>
    </InfoPage>
  ),
});
