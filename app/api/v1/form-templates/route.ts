import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { FORM_TEMPLATES, getFormTemplate } from '@/lib/forms/templates';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['forms:read'],
  });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const category = url.searchParams.get('category') ?? undefined;
  const industry = url.searchParams.get('industry') ?? undefined;

  let templates = FORM_TEMPLATES;

  if (category) {
    templates = templates.filter((t) => t.category === category);
  }
  if (industry) {
    templates = templates.filter(
      (t) => t.industry === 'general' || t.industry === industry,
    );
  }

  logV1Access(auth.context, 'form-templates.list', { category, industry });
  return jsonWithContext({ data: templates }, auth.context);
}
