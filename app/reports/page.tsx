import { AppShell } from "@/components/AppShell";
import { ReportsExplorer } from "@/components/ReportsExplorer";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [products, employees, sections, roles] = await Promise.all([
    prisma.product.findMany({
      include: {
        sections: { include: { section: true } },
        assignments: { include: { employee: { include: { section: true, role: true } } } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } })
  ]);

  const reportProducts = products.map((product) => ({
    id: product.id,
    itemCode: product.itemCode,
    itemName: product.itemName,
    revenue: Number(product.revenue),
    createdAt: product.createdAt.toISOString(),
    createdAtDisplay: product.createdAt.toLocaleString(),
    sections: product.sections.map((productSection) => {
      const sectionAmount = Number(product.revenue) * (Number(productSection.percentage) / 100);
      return {
        productSectionId: productSection.id,
        sectionId: productSection.sectionId,
        sectionName: productSection.section.name,
        sectionPercentage: Number(productSection.percentage),
        sectionAmount,
        employees: product.assignments
          .filter((assignment) => assignment.employee.sectionId === productSection.sectionId)
          .map((assignment) => ({
            assignmentId: assignment.id,
            employeeId: assignment.employeeId,
            employeeName: assignment.employee.name,
            epfNumber: assignment.employee.epfNumber,
            roleId: assignment.employee.roleId,
            roleName: assignment.employee.role.name,
            rolePercentage: Number(assignment.rolePercentage),
            calculatedAmount: Number(assignment.calculatedAmount)
          }))
      };
    })
  }));

  return (
    <AppShell>
      <PageHeader title="Reports" description="Search and filter product, employee, distribution, role, and section breakdowns." />
      <div className="mt-6">
        <ReportsExplorer
          products={reportProducts}
          filterOptions={{
            products: products.map((product) => ({ id: product.id, label: `${product.itemCode} - ${product.itemName}` })),
            employees: employees.map((employee) => ({ id: employee.id, label: `${employee.epfNumber} - ${employee.name}` })),
            sections: sections.map((section) => ({ id: section.id, label: section.name })),
            roles: roles.map((role) => ({ id: role.id, label: role.name }))
          }}
        />
      </div>
    </AppShell>
  );
}
