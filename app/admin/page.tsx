import { redirect } from "next/navigation";

/**
 * /admin → Redirect to /admin/dashboard
 * 
 * This ensures clean routing:
 * - Unauthenticated users: middleware redirects to /auth/signin
 * - Authenticated founders: auth callback redirects to /admin/dashboard
 * - Non-founders: middleware redirects to /pricing
 * 
 * All admin routes must be prefixed with /admin/[page]
 */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
