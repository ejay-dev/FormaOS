export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file';

export interface FieldOption {
  label: string;
  value: string;
}

export interface ConditionalLogic {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
  action: 'show' | 'hide';
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic[];
  defaultValue?: string;
  order: number;
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  allowMultipleSubmissions: boolean;
  showProgressBar: boolean;
  requireAuthentication: boolean;
}

export interface Form {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  organization_id: string;
  data: Record<string, any>;
  submitted_by?: string;
  submitted_by_email?: string;
  created_at: string;
}