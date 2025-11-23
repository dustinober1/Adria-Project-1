export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
}

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helperText?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string | null;
  serviceId?: string | null;
  fields: FormField[];
  version: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmission {
  id: string;
  formTemplateId: string;
  templateVersion: number;
  userId?: string | null;
  email?: string | null;
  responses: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface FormTemplateCreateRequest {
  name: string;
  description?: string;
  serviceId?: string;
  active?: boolean;
  fields: FormField[];
}

export interface FormTemplateUpdateRequest {
  name?: string;
  description?: string;
  serviceId?: string;
  active?: boolean;
  fields?: FormField[];
}

export interface FormTemplateListResponse {
  data: FormTemplate[];
}

export interface FormSubmissionRequest {
  templateId: string;
  email?: string;
  responses: Record<string, unknown>;
  recaptchaToken: string;
}

export interface FormSubmissionResponse {
  id: string;
  templateId: string;
  status: 'received';
  createdAt: Date;
  notifications: {
    visitor: boolean;
    admin: boolean;
  };
}

export interface FormSubmissionListFilters {
  templateId?: string;
  email?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
