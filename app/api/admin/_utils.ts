export function parsePageParams(searchParams: URLSearchParams, pageSize = 25) {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const sizeRaw = Number(searchParams.get("pageSize") ?? pageSize.toString());
  const limit = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, 100) : pageSize;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}
