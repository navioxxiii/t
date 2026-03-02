/**
 * Create Email Template Dialog
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEmailTemplate } from '@/hooks/useAdminEmail';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    name?: string;
    subject?: string;
    content?: string;
    category?: string;
    replyMode?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

const CATEGORIES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'product_update', label: 'Product Update' },
  { value: 'compliance_kyc', label: 'Compliance / KYC' },
  { value: 'security_alert', label: 'Security Alert' },
  { value: 'transaction_notice', label: 'Transaction Notice' },
  { value: 'custom', label: 'Custom' },
];

const REPLY_MODES = [
  { value: 'no_reply', label: 'No Reply' },
  { value: 'reply_via_tawk', label: 'Reply via Chat' },
  { value: 'reply_via_dashboard', label: 'Reply via Dashboard' },
];

export function CreateTemplateDialog({ open, onOpenChange, initialData }: CreateTemplateDialogProps) {
  const createMutation = useCreateEmailTemplate();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    category: initialData?.category || 'custom',
    replyMode: initialData?.replyMode || 'no_reply',
    ctaLabel: initialData?.ctaLabel || '',
    ctaUrl: initialData?.ctaUrl || '',
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({ name: '', subject: '', content: '', category: 'custom', replyMode: 'no_reply', ctaLabel: '', ctaUrl: '' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>Save a reusable email template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name <span className="text-action-red">*</span></Label>
            <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g., Monthly Newsletter" />
            {errors.name && <p className="text-xs text-action-red">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject <span className="text-action-red">*</span></Label>
            <Input id="subject" value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} placeholder="Email subject line" />
            {errors.subject && <p className="text-xs text-action-red">{errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content <span className="text-action-red">*</span></Label>
            <Textarea id="content" value={formData.content} onChange={(e) => handleChange('content', e.target.value)} placeholder="Email body" rows={8} />
            {errors.content && <p className="text-xs text-action-red">{errors.content}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reply Mode</Label>
              <Select value={formData.replyMode} onValueChange={(v) => handleChange('replyMode', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {REPLY_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Label</Label>
              <Input value={formData.ctaLabel} onChange={(e) => handleChange('ctaLabel', e.target.value)} placeholder="e.g., Open Dashboard" />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={formData.ctaUrl} onChange={(e) => handleChange('ctaUrl', e.target.value)} placeholder="e.g., /settings/kyc" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
