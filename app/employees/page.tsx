import { AppShell } from "@/components/AppShell";
import { EntityManager } from "@/components/forms/EntityManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const [employees, sections, roles] = await Promise.all([
    prisma.employee.findMany({ include: { section: true, role: true }, orderBy: { name: "asc" } }),
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } })
  ]);

  const rows = employees.map((employee) => ({
    id: employee.id,
    epfNumber: employee.epfNumber,
    name: employee.name,
    sectionId: employee.sectionId,
    roleId: employee.roleId,
    section: employee.section.name,
    role: employee.role.name
  }));

  return (
    <AppShell>
      <PageHeader title="Employees" description="Manage employees, EPF numbers, sections, and role assignments." />
      <div className="mt-6">
        <EntityManager
          rows={rows}
          endpoint="/api/employees"
          formTitle="Employee"
          emptyValues={{ epfNumber: "", name: "", sectionId: "", roleId: "" }}
          fields={[
            { name: "epfNumber", label: "EPF Number" },
            { name: "name", label: "Employee Name" },
            { name: "sectionId", label: "Section", type: "select", options: sections.map((item) => ({ value: item.id, label: item.name })) },
            { name: "roleId", label: "Role", type: "select", options: roles.map((item) => ({ value: item.id, label: item.name })) }
          ]}
          columns={[
            { key: "epfNumber", header: "EPF", sortable: true },
            { key: "name", header: "Name", sortable: true },
            { key: "section", header: "Section", sortable: true },
            { key: "role", header: "Role", sortable: true }
          ]}
        />
      </div>
    </AppShell>
  );
}
