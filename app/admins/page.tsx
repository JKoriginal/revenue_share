import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { EntityManager } from "@/components/forms/EntityManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireSuperAdmin();
  const admins = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const rows = admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    roleDisplay: admin.role === UserRole.SUPERADMIN ? "Super Admin" : "Admin"
  }));

  return (
    <AppShell>
      <PageHeader title="Admins" description="Only the super admin can add or remove admin users. All system permissions are otherwise shared." />
      <div className="mt-6">
        <EntityManager
          rows={rows}
          endpoint="/api/admins"
          formTitle="Admin"
          emptyValues={{ name: "", email: "", password: "" }}
          fields={[
            { name: "name", label: "Name" },
            { name: "email", label: "Email", type: "email" },
            { name: "password", label: "Password", type: "password" }
          ]}
          columns={[
            { key: "name", header: "Name", sortable: true },
            { key: "email", header: "Email", sortable: true },
            { key: "roleDisplay", header: "Role", sortable: true }
          ]}
        />
      </div>
    </AppShell>
  );
}
