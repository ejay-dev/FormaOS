import { notFound } from "next/navigation";
import FormBuilderClient from "./form-builder-client";

export default async function FormBuilderPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const formId = resolvedParams?.id ?? "";
  if (!formId) return notFound();

  return <FormBuilderClient formId={formId} />;
}
