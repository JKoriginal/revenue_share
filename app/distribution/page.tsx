import { AppShell } from "@/components/AppShell";
import { DistributionForm } from "@/components/forms/DistributionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DistributionPage() {
  const [products, sections, employees, productSections, assignments] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.section.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ include: { role: true }, orderBy: { name: "asc" } }),
    prisma.productSection.findMany(),
    prisma.productEmployeeAssignment.findMany({ include: { employee: true } })
  ]);

  return (
    <AppShell>
      <PageHeader title="Revenue Distribution" description="Select a product, allocate section percentages, then enter each selected employee's product percentage." />
      <div className="mt-6">
        <DistributionForm
          products={products.map((product) => ({
            id: product.id,
            itemCode: product.itemCode,
            itemName: product.itemName,
            revenue: Number(product.revenue)
          }))}
          sections={sections.map((section) => ({ id: section.id, name: section.name }))}
          employees={employees.map((employee) => ({
            id: employee.id,
            name: employee.name,
            epfNumber: employee.epfNumber,
            sectionId: employee.sectionId,
            roleName: employee.role.name
          }))}
          savedDistributions={products.map((product) => ({
            productId: product.id,
            sections: productSections
              .filter((section) => section.productId === product.id)
              .map((section) => ({
                sectionId: section.sectionId,
                percentage: Number(section.percentage),
                employees: assignments
                  .filter((assignment) => assignment.productId === product.id && assignment.employee.sectionId === section.sectionId)
                  .map((assignment) => ({
                    employeeId: assignment.employeeId,
                    rolePercentage: Number(assignment.rolePercentage)
                  }))
              }))
          }))}
        />
      </div>
    </AppShell>
  );
}
