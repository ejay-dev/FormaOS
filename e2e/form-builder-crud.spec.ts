import { expect, test } from '@playwright/test';

import { getWorkspaceSeedContext } from './helpers/workspace-seed';

test.describe('Form builder CRUD', () => {
  test('creates, reads, updates, and deletes fields on a form definition', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const formTitle = `E2E Form Builder ${unique}`;
    const createdFieldLabel = `Created Field ${unique}`;
    const updatedFieldLabel = `Updated Field ${unique}`;
    const updatedPlaceholder = `contact-${unique}@example.com`;
    const now = new Date().toISOString();

    const { data: seededForm, error: seedError } = await context.admin
      .from('forms')
      .insert({
        organization_id: context.orgId,
        title: formTitle,
        description: 'Form builder CRUD verification',
        fields: [
          {
            id: `existing-${unique}`,
            type: 'text',
            label: 'Existing Field',
            placeholder: 'Enter value',
            validation: { required: false },
            order: 0,
          },
        ],
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Thanks',
          allowMultipleSubmissions: true,
          showProgressBar: false,
          requireAuthentication: false,
        },
        status: 'draft',
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    expect(seedError).toBeNull();
    const formId = seededForm?.id as string;
    expect(formId).toBeTruthy();

    try {
      const { data: initialRead, error: readError } = await context.anon
        .from('forms')
        .select('id, title, fields')
        .eq('organization_id', context.orgId)
        .eq('id', formId)
        .single();
      expect(readError).toBeNull();
      expect(initialRead?.title).toBe(formTitle);

      const initialFields = Array.isArray((initialRead as any)?.fields)
        ? ((initialRead as any).fields as Array<Record<string, unknown>>)
        : [];

      const createdField = {
        id: `created-${unique}`,
        type: 'email',
        label: createdFieldLabel,
        placeholder: 'email@example.com',
        validation: { required: true },
        order: initialFields.length,
      };

      const { error: createFieldError } = await context.anon
        .from('forms')
        .update({
          fields: [...initialFields, createdField],
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', context.orgId)
        .eq('id', formId);
      expect(createFieldError).toBeNull();

      const { data: afterCreateRead, error: afterCreateError } = await context.anon
        .from('forms')
        .select('fields')
        .eq('organization_id', context.orgId)
        .eq('id', formId)
        .single();
      expect(afterCreateError).toBeNull();
      const fieldsAfterCreate = Array.isArray((afterCreateRead as any)?.fields)
        ? ((afterCreateRead as any).fields as Array<Record<string, unknown>>)
        : [];
      expect(
        fieldsAfterCreate.some((field) => field.label === createdFieldLabel),
      ).toBe(true);

      const updatedFields = fieldsAfterCreate.map((field) =>
        field.id === createdField.id
          ? {
              ...field,
              label: updatedFieldLabel,
              placeholder: updatedPlaceholder,
            }
          : field,
      );

      const { error: updateFieldError } = await context.anon
        .from('forms')
        .update({
          fields: updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', context.orgId)
        .eq('id', formId);
      expect(updateFieldError).toBeNull();

      const { data: afterUpdateRead, error: afterUpdateError } = await context.anon
        .from('forms')
        .select('fields')
        .eq('organization_id', context.orgId)
        .eq('id', formId)
        .single();
      expect(afterUpdateError).toBeNull();
      const fieldsAfterUpdate = Array.isArray((afterUpdateRead as any)?.fields)
        ? ((afterUpdateRead as any).fields as Array<Record<string, unknown>>)
        : [];
      expect(
        fieldsAfterUpdate.some(
          (field) =>
            field.label === updatedFieldLabel &&
            field.placeholder === updatedPlaceholder,
        ),
      ).toBe(true);

      const fieldsAfterDelete = fieldsAfterUpdate.filter(
        (field) => field.id !== createdField.id,
      );
      const { error: deleteFieldError } = await context.anon
        .from('forms')
        .update({
          fields: fieldsAfterDelete,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', context.orgId)
        .eq('id', formId);
      expect(deleteFieldError).toBeNull();

      const { data: finalRead, error: finalReadError } = await context.anon
        .from('forms')
        .select('fields')
        .eq('organization_id', context.orgId)
        .eq('id', formId)
        .single();
      expect(finalReadError).toBeNull();
      const finalFields = Array.isArray((finalRead as any)?.fields)
        ? ((finalRead as any).fields as Array<Record<string, unknown>>)
        : [];
      expect(
        finalFields.some((field) => field.label === updatedFieldLabel),
      ).toBe(false);
    } finally {
      await context.admin
        .from('forms')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('id', formId);
    }
  });
});
