import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/components/admin-shell";
import { requireFounderAccess } from "@/app/app/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const result = await requireFounderAccess();
    console.log("[admin/layout] ✅ Founder access granted", { email: result.user.email });
  } catch (error) {
    console.error("[admin/layout] ❌ Admin access denied:", error);
    redirect("/auth/signin");
  }

  return <AdminShell>{children}</AdminShell>;
}
