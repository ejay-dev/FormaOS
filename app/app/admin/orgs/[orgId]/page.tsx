import { redirect } from "next/navigation";

type OrgRedirectProps = {
  params: Promise<{ orgId: string }>;
};

export default async function LegacyAdminOrgPage({ params }: OrgRedirectProps) {
  const { orgId } = await params;
  redirect(`/admin/orgs/${orgId}`);
}
