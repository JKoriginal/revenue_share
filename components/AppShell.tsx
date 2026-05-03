import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Boxes, Building2, LayoutDashboard, LogOut, Shield, Users, WalletCards } from "lucide-react";
import { UserRole } from "@prisma/client";
import { clearSession, getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/sections", label: "Sections", icon: Building2 },
  { href: "/roles", label: "Roles", icon: Shield },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/distribution", label: "Distribution", icon: WalletCards },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  async function logout() {
    "use server";
    clearSession();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white p-5 md:block">
        <Link href="/dashboard" className="block">
          <p className="text-lg font-bold text-ink">Revenue Share</p>
          <p className="text-xs font-medium text-stone-500">Employee earnings system</p>
        </Link>
        <nav className="mt-8 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-mint hover:text-forest"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {user.role === UserRole.SUPERADMIN ? (
            <Link
              href="/admins"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-mint hover:text-forest"
            >
              <Shield className="h-4 w-4" />
              Admins
            </Link>
          ) : null}
        </nav>
        <form action={logout} className="absolute bottom-5 left-5 right-5">
          <div className="mb-3 rounded-lg bg-stone-50 p-3">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-forest">{user.role}</p>
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
