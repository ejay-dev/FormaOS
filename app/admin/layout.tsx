import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/components/admin-shell";
import { requireFounderAccess } from "@/app/app/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const result = await requireFounderAccess();
    console.log("[admin/layout] ✅ Founder access granted", { 
      email: result.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[admin/layout] ❌ Admin access denied:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    // Redirect unauthorized users
    if (errorMessage === "Forbidden") {
      redirect("/pricing");
    }
    redirect("/auth/signin");
  }

  return <AdminShell>{children}</AdminShell>;
}
