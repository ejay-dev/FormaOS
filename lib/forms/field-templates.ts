import { FormField } from './types';

/**
 * The question types the builder offers. Each template is copied into a new
 * field, so its label is both the button in the builder and the question a
 * respondent first sees.
 *
 * FieldType also allows 'file', but there is deliberately no template for it:
 * the public form at /submit/[formId] has no attachment store, so a file
 * question could be published and then never answered.
 */
export const FIELD_TEMPLATES: Record<string, Omit<FormField, 'id' | 'order'>> = {
  text: {
    type: 'text',
    label: 'Short answer',
    placeholder: '',
    validation: { required: false },
  },
  email: {
    type: 'email',
    label: 'Email address',
    placeholder: 'name@example.com',
    validation: { required: true },
  },
  number: {
    type: 'number',
    label: 'Number',
    placeholder: '',
    validation: { required: false },
  },
  textarea: {
    type: 'textarea',
    label: 'Long answer',
    placeholder: '',
    validation: { required: false },
  },
  select: {
    type: 'select',
    label: 'Dropdown',
    options: [
      { label: 'First choice', value: 'first-choice' },
      { label: 'Second choice', value: 'second-choice' },
    ],
    validation: { required: false },
  },
  radio: {
    type: 'radio',
    label: 'Multiple choice',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
    validation: { required: false },
  },
  checkbox: {
    type: 'checkbox',
    label: 'Tick to confirm',
    validation: { required: false },
  },
  date: {
    type: 'date',
    label: 'Date',
    validation: { required: false },
  },
};