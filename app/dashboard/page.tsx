import { Boxes, Building2, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MonthlyDistributionSummary, MonthlyDistributionView } from "@/components/MonthlyShareChart";
import { RevenueChart } from "@/components/RevenueChart";
import { SectionRevenueShareView } from "@/components/SectionRevenueShareView";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [employeeCount, sectionCount, productCount, products, assignments, monthlyProducts] = await Promise.all([
    prisma.employee.count(),
    prisma.section.count(),
    prisma.product.count(),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.productEmployeeAssignment.findMany({
      include: { employee: true, product: true },
      orderBy: { calculatedAmount: "desc" },
      take: 6
    }),
    prisma.product.findMany({
      include: {
        sections: { include: { section: true } },
        assignments: true
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const totalRevenue = products.reduce((sum, product) => sum + Number(product.revenue), 0);
  const monthlyShareMap = new Map<
    string,
    { month: string; year: number; monthNumber: number; revenue: number; sectionShare: number; employeeShare: number }
  >();

  for (const product of monthlyProducts) {
    const year = product.createdAt.getFullYear();
    const monthNumber = product.createdAt.getMonth() + 1;
    const month = product.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const key = `${year}-${String(monthNumber).padStart(2, "0")}`;
    const current = monthlyShareMap.get(key) || { month, year, monthNumber, revenue: 0, sectionShare: 0, employeeShare: 0 };
    const revenue = Number(product.revenue);

    current.revenue += revenue;
    current.sectionShare += product.sections.reduce((sum, section) => sum + revenue * (Number(section.percentage) / 100), 0);
    current.employeeShare += product.assignments.reduce((sum, assignment) => sum + Number(assignment.calculatedAmount), 0);

    monthlyShareMap.set(key, current);
  }

  const monthlyShares = Array.from(monthlyShareMap.values()).sort((a, b) => a.year - b.year || a.monthNumber - b.monthNumber);
  const sectionShareMap = new Map<
    string,
    { sectionId: number; sectionName: string; year: number; amount: number; productIds: Set<number> }
  >();

  for (const product of monthlyProducts) {
    const revenue = Number(product.revenue);
    const year = product.createdAt.getFullYear();

    for (const productSection of product.sections) {
      const key = `${year}-${productSection.sectionId}`;
      const current =
        sectionShareMap.get(key) ||
        {
          sectionId: productSection.sectionId,
          sectionName: productSection.section.name,
          year,
          amount: 0,
          productIds: new Set<number>()
        };

      current.amount += revenue * (Number(productSection.percentage) / 100);
      current.productIds.add(product.id);
      sectionShareMap.set(key, current);
    }
  }

  const sectionShares = Array.from(sectionShareMap.values()).map((item) => ({
    sectionId: item.sectionId,
    sectionName: item.sectionName,
    year: item.year,
    amount: item.amount,
    productCount: item.productIds.size
  }));

  return (
    <AppShell>
      <PageHeader title="Dashboard" description="A fast overview of employees, products, revenue, and current distribution results." />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={employeeCount} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Sections" value={sectionCount} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Products" value={productCount} icon={<Boxes className="h-5 w-5" />} />
        <StatCard label="Recent Revenue" value={money(totalRevenue)} icon={<WalletCards className="h-5 w-5" />} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <RevenueChart data={products.map((product) => ({ name: product.itemCode, revenue: Number(product.revenue) }))} />
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Top Employee Earnings</h2>
          <div className="mt-4 space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{assignment.employee.name}</p>
                  <p className="text-xs text-stone-500">{assignment.product.itemCode}</p>
                </div>
                <p className="text-sm font-bold text-forest">{money(Number(assignment.calculatedAmount))}</p>
              </div>
            ))}
            {!assignments.length ? <p className="text-sm text-stone-500">No distributions saved yet.</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <MonthlyDistributionView data={monthlyShares} />
        <MonthlyDistributionSummary data={monthlyShares} />
      </div>
      <div className="mt-4">
        <SectionRevenueShareView data={sectionShares} />
      </div>
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Recent Products</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {products.map((product) => (
            <div key={product.id} className="rounded-md bg-stone-50 p-3">
              <p className="text-sm font-semibold text-ink">{product.itemName}</p>
              <p className="text-xs text-stone-500">{product.itemCode}</p>
              <p className="mt-2 text-sm font-bold text-forest">{money(Number(product.revenue))}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
