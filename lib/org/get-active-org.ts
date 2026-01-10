export type ActiveOrg = {
  id: string;
  name: string;
};

export async function getActiveOrg(supabase: any): Promise<ActiveOrg | null> {
  const { data, error } = await supabase
    .from("org_members") // ✅ CORRECT TABLE NAME
    .select(
      `
      organization:organizations (
        id,
        name
      )
    `
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getActiveOrg] failed:", error);
    return null;
  }

  if (!data?.organization) return null;

  return data.organization as ActiveOrg;
}