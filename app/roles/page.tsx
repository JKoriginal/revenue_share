import { AppShell } from "@/components/AppShell";
import { EntityManager } from "@/components/forms/EntityManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" }
  });
  const rows = roles.map((role) => ({
    id: role.id,
    name: role.name,
    employeeCount: role._count.employees
  }));

  return (
    <AppShell>
      <PageHeader title="Roles" description="Define employee role names. Distribution percentages are entered per product assignment." />
      <div className="mt-6">
        <EntityManager
          rows={rows}
          endpoint="/api/roles"
          formTitle="Role"
          emptyValues={{ name: "" }}
          fields={[{ name: "name", label: "Role Name" }]}
          columns={[
            { key: "name", header: "Name", sortable: true },
            { key: "employeeCount", header: "Employee Count", sortable: true }
          ]}
        />
      </div>
    </AppShell>
  );
}
