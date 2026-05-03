import { AppShell } from "@/components/AppShell";
import { EntityManager } from "@/components/forms/EntityManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const rows = products.map((product) => ({
    id: product.id,
    itemCode: product.itemCode,
    itemName: product.itemName,
    revenue: Number(product.revenue),
    revenueDisplay: money(Number(product.revenue))
  }));

  return (
    <AppShell>
      <PageHeader title="Products" description="Track products and the revenue pool available for sharing." />
      <div className="mt-6">
        <EntityManager
          rows={rows}
          endpoint="/api/products"
          formTitle="Product"
          emptyValues={{ itemCode: "", itemName: "", revenue: "" }}
          fields={[
            { name: "itemCode", label: "Item Code" },
            { name: "itemName", label: "Item Name" },
            { name: "revenue", label: "Revenue", type: "number" }
          ]}
          columns={[
            { key: "itemCode", header: "Item Code", sortable: true },
            { key: "itemName", header: "Item Name", sortable: true },
            { key: "revenueDisplay", header: "Revenue", sortable: true }
          ]}
        />
      </div>
    </AppShell>
  );
}
