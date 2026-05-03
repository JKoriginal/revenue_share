import { AppShell } from "@/components/AppShell";
import { EntityManager } from "@/components/forms/EntityManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SectionsPage() {
  const sections = await prisma.section.findMany({ orderBy: { name: "asc" } });
  const rows = sections.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description || ""
  }));

  return (
    <AppShell>
      <PageHeader title="Sections" description="Create the company sections that participate in product revenue." />
      <div className="mt-6">
        <EntityManager
          rows={rows}
          endpoint="/api/sections"
          formTitle="Section"
          emptyValues={{ name: "", description: "" }}
          fields={[
            { name: "name", label: "Section Name" },
            { name: "description", label: "Description", type: "textarea" }
          ]}
          columns={[
            { key: "name", header: "Name", sortable: true },
            { key: "description", header: "Description" }
          ]}
        />
      </div>
    </AppShell>
  );
}
