import { headers } from "next/headers";

export async function getAdminFetchConfig() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  const cookie = headerList.get("cookie") ?? "";

  return {
    base,
    headers: cookie ? { cookie } : undefined,
  };
}
