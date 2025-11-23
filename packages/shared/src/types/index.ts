// Common types shared across frontend and backend

// Re-export user types from dedicated module
export * from './user.types';

// Re-export auth types from dedicated module
export * from './auth.types';
export * from './form.types';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorId: string;
  featuredImageUrl?: string;
  status: BlogPostStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  serviceInterest?: string;
  status: InquiryStatus;
  respondedAt?: Date | null;
  closedAt?: Date | null;
  adminNotes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum InquiryStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export interface CreateInquiryRequest {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  serviceInterest?: string;
  recaptchaToken: string;
}

export interface InquiryListResponse {
  data: ContactInquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
