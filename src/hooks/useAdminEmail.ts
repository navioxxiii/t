/**
 * Admin Email Management React Query Hooks
 * Handles data fetching and mutations for email templates, sending, and history
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  reply_mode: string;
  cta_label: string | null;
  cta_url_template: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailHistoryRecord {
  id: string;
  subject: string;
  content: string;
  category: string;
  reply_mode: string;
  cta_label: string | null;
  cta_url: string | null;
  recipient_type: string;
  recipient_filter: Record<string, unknown> | null;
  recipient_emails: string[];
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  error_details: { errors?: string[] } | null;
  template_id: string | null;
  sent_by: string;
  created_at: string;
  completed_at: string | null;
  sent_by_profile?: { email: string; full_name: string | null } | null;
}

export interface SendEmailPayload {
  recipientType: 'individual' | 'group' | 'all';
  recipientEmails?: string[];
  filters?: {
    role?: string;
    kyc_status?: string;
    is_banned?: boolean;
  };
  subject: string;
  content: string;
  category: string;
  replyMode: string;
  ctaLabel?: string;
  ctaUrl?: string;
  templateId?: string;
  testMode?: boolean;
  confirmationPhrase?: string;
}

export interface RecipientPreview {
  count: number;
  preview: string[];
}

interface TemplateQueryParams {
  pageIndex?: number;
  pageSize?: number;
  globalFilter?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface HistoryQueryParams {
  pageIndex?: number;
  pageSize?: number;
  globalFilter?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateTemplateData {
  name: string;
  subject: string;
  content: string;
  category: string;
  replyMode: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface UpdateTemplateData extends CreateTemplateData {
  id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useEmailTemplates(params: TemplateQueryParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.pageIndex !== undefined) queryParams.set('pageIndex', params.pageIndex.toString());
  if (params.pageSize !== undefined) queryParams.set('pageSize', params.pageSize.toString());
  if (params.globalFilter) queryParams.set('globalFilter', params.globalFilter);
  if (params.category) queryParams.set('category', params.category);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  return useQuery({
    queryKey: ['admin-email-templates', params],
    queryFn: async () => {
      const response = await fetch(`/api/admin/email/templates?${queryParams.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch templates');
      }
      return response.json() as Promise<{ data: EmailTemplate[]; total: number }>;
    },
    staleTime: 30000,
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ['admin-email-template', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/email/templates/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch template');
      }
      return response.json() as Promise<EmailTemplate>;
    },
    enabled: !!id,
  });
}

export function useEmailHistory(params: HistoryQueryParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.pageIndex !== undefined) queryParams.set('pageIndex', params.pageIndex.toString());
  if (params.pageSize !== undefined) queryParams.set('pageSize', params.pageSize.toString());
  if (params.globalFilter) queryParams.set('globalFilter', params.globalFilter);
  if (params.status) queryParams.set('status', params.status);
  if (params.category) queryParams.set('category', params.category);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);

  return useQuery({
    queryKey: ['admin-email-history', params],
    queryFn: async () => {
      const response = await fetch(`/api/admin/email/history?${queryParams.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch history');
      }
      return response.json() as Promise<{ data: EmailHistoryRecord[]; total: number }>;
    },
    staleTime: 30000,
  });
}

export function useRecipientPreview(filters: { role?: string; kyc_status?: string; is_banned?: string }) {
  const queryParams = new URLSearchParams();
  if (filters.role) queryParams.set('role', filters.role);
  if (filters.kyc_status) queryParams.set('kyc_status', filters.kyc_status);
  if (filters.is_banned) queryParams.set('is_banned', filters.is_banned);

  const hasFilters = !!(filters.role || filters.kyc_status || filters.is_banned);

  return useQuery({
    queryKey: ['admin-email-recipients', filters],
    queryFn: async () => {
      const response = await fetch(`/api/admin/email/recipients?${queryParams.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recipient preview');
      }
      return response.json() as Promise<RecipientPreview>;
    },
    enabled: hasFilters,
    staleTime: 15000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendEmailPayload) => {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-history'] });

      toast.success('Email Sent', {
        description: `Successfully sent to ${data.sentCount} of ${data.recipientCount} recipients.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Send Email', {
        description: error.message,
      });
    },
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const response = await fetch('/api/admin/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });

      toast.success('Template Created', {
        description: `"${data.template.name}" has been saved.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Create Template', {
        description: error.message,
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTemplateData) => {
      const { id, ...rest } = data;
      const response = await fetch(`/api/admin/email/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });

      toast.success('Template Updated', {
        description: `"${data.template.name}" has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Update Template', {
        description: error.message,
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/email/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });

      toast.success('Template Deleted', {
        description: 'The template has been removed.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Delete Template', {
        description: error.message,
      });
    },
  });
}
