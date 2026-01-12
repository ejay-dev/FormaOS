import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/components/admin-shell";
import { requireFounderAccess } from "@/app/app/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireFounderAccess();
  } catch (error) {
    console.error("Admin access denied:", error);
    redirect("/auth/signin");
  }

  return <AdminShell>{children}</AdminShell>;
}
