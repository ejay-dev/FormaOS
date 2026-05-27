import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

import { createPolicy } from '@/app/app/actions/policies';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SubmitButton } from '@/components/ui/submit-button';
import { NDIS_CATEGORIES } from '@/lib/compliance/ndis/categories';

const FRAMEWORK_OPTIONS = [
  'General',
  'ISO 27001',
  'SOC 2',
  'NIST CSF',
  'NDIS',
  'GDPR',
  'HIPAA',
];

export default async function NewPolicyPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  async function createPolicyAndRedirect(formData: FormData) {
    'use server';

    const result = await createPolicy(formData);
    if (!result || 'error' in result) {
      redirect('/app/policies');
    }
    if (result?.policyId) {
      redirect(`/app/policies/${result.policyId}`);
    }
    redirect('/app/policies');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/app/policies"
          className="rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Policy</h1>
          <p className="text-muted-foreground">
            Add a new governance policy for your organization.
          </p>
        </div>
      </div>

      <form action={createPolicyAndRedirect} className="space-y-6">
        <div className="space-y-4 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">Policy Details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="title">
              Policy title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              type="text"
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
              placeholder="e.g. Information Security Policy"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="framework"
            >
              Framework
            </label>
            <select
              id="framework"
              name="framework"
              defaultValue="General"
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
            >
              {FRAMEWORK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="ndis_category"
            >
              NDIS Practice Standard category
            </label>
            <select
              id="ndis_category"
              name="ndis_category"
              defaultValue="none"
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
            >
              <option value="none">— Not NDIS-tagged —</option>
              {NDIS_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Tagging this policy lets the NDIS compliance evaluator score it against the
              matching Practice Standard. Untagged policies remain in scope for general
              frameworks (ISO, SOC 2, etc.) but won&apos;t satisfy NDIS predicates.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
              placeholder="Summarize purpose and scope of this policy"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="content">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={12}
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
              placeholder="Write policy statements, controls, and responsibilities"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/app/policies"
            className="rounded-lg border border-input px-4 py-2 transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
          <SubmitButton
            size="md"
            fullWidth={false}
            showArrow={false}
            loadingText="Creating…"
            className="px-4 rounded-lg"
          >
            Create Policy
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
