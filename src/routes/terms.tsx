import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => infoHead("Terms and Conditions", "The terms that apply when you shop on ShopSphere."),
  component: () => (
    <InfoPage eyebrow="Legal" title="Terms and Conditions" intro="Please read these terms before placing an order on ShopSphere.">
      <h2>Orders</h2>
      <p>An order is a request to buy. It is accepted only once its status changes to Confirmed after stock is verified. Rejected orders are never charged.</p>
      <h2>Pricing</h2>
      <p>All prices are in Indian Rupees and include applicable taxes. The price charged is the price recorded at the time the order is placed.</p>
      <h2>Delivery</h2>
      <p>Delivery is free on orders of ₹499 or more; otherwise a ₹49 delivery charge applies. Estimated delivery is 3–5 business days.</p>
      <h2>Returns</h2>
      <p>Most items can be returned within 7 days of delivery in original condition. Perishable groceries and opened personal care items cannot be returned.</p>
    </InfoPage>
  ),
});
