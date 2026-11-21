import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { SystemStatus } from "@/components/SystemStatus";

export const Route = createFileRoute("/admin/integrations")({
  component: () => (
    <>
      <PageHeader title="Integration monitoring" description="Live health checks for PostgreSQL, Kafka, OpenSearch and the background workers." />
      <SystemStatus />
    </>
  ),
});
