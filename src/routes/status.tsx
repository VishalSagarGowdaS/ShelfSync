import { createFileRoute } from "@tanstack/react-router";
import { SystemStatus } from "@/components/SystemStatus";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "System status — ShopSphere" },
      { name: "description", content: "Connect the ShopSphere backend and check PostgreSQL, Kafka and OpenSearch health." },
      { property: "og:title", content: "System status — ShopSphere" },
      { property: "og:description", content: "Live health of ShopSphere's services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="container-shop py-8">
      <h1 className="mb-6 text-3xl font-extrabold">System status</h1>
      <SystemStatus />
    </div>
  ),
});
