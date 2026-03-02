/**
 * Edit Email Template Dialog
 */

'use client';

import { useState, useEffect } from 'react';
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
import { useUpdateEmailTemplate, type EmailTemplate } from '@/hooks/useAdminEmail';

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
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

export function EditTemplateDialog({ open, onOpenChange, template }: EditTemplateDialogProps) {
  const updateMutation = useUpdateEmailTemplate();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'custom',
    replyMode: 'no_reply',
    ctaLabel: '',
    ctaUrl: '',
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  useEffect(() => {
    if (open && template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        replyMode: template.reply_mode,
        ctaLabel: template.cta_label || '',
        ctaUrl: template.cta_url_template || '',
      });
      setErrors({});
    }
  }, [open, template]);

  if (!template) return null;

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
    updateMutation.mutate(
      { id: template.id, ...formData },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>Update the email template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Template Name <span className="text-action-red">*</span></Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
            {errors.name && <p className="text-xs text-action-red">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subject">Subject <span className="text-action-red">*</span></Label>
            <Input id="edit-subject" value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} />
            {errors.subject && <p className="text-xs text-action-red">{errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content <span className="text-action-red">*</span></Label>
            <Textarea id="edit-content" value={formData.content} onChange={(e) => handleChange('content', e.target.value)} rows={8} />
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
              <Input value={formData.ctaLabel} onChange={(e) => handleChange('ctaLabel', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={formData.ctaUrl} onChange={(e) => handleChange('ctaUrl', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
