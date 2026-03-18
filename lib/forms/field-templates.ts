import { FormField } from './types';

export const FIELD_TEMPLATES: Record<string, Omit<FormField, 'id' | 'order'>> = {
  text: {
    type: 'text',
    label: 'Text Field',
    placeholder: 'Enter text...',
    validation: { required: false },
  },
  email: {
    type: 'email',
    label: 'Email Address',
    placeholder: 'email@example.com',
    validation: { required: true },
  },
  number: {
    type: 'number',
    label: 'Number Field',
    placeholder: '0',
    validation: { required: false },
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    placeholder: 'Enter detailed text...',
    validation: { required: false },
  },
  select: {
    type: 'select',
    label: 'Dropdown',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ],
    validation: { required: false },
  },
  radio: {
    type: 'radio',
    label: 'Radio Buttons',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
    validation: { required: false },
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    validation: { required: false },
  },
  date: {
    type: 'date',
    label: 'Date',
    validation: { required: false },
  },
};