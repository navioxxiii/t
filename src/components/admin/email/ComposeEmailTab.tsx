/**
 * Compose Email Tab
 * Form for composing and sending admin emails to members
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useSendEmail,
  useEmailTemplates,
  useRecipientPreview,
  type EmailTemplate,
  type SendEmailPayload,
} from '@/hooks/useAdminEmail';
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Send, TestTube, X } from 'lucide-react';

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

const CATEGORY_DEFAULT_REPLY_MODE: Record<string, string> = {
  announcement: 'no_reply',
  product_update: 'no_reply',
  compliance_kyc: 'reply_via_tawk',
  security_alert: 'reply_via_tawk',
  transaction_notice: 'reply_via_dashboard',
  custom: 'no_reply',
};

interface ComposeEmailTabProps {
  onSaveAsTemplate?: (data: {
    name: string;
    subject: string;
    content: string;
    category: string;
    replyMode: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }) => void;
}

export function ComposeEmailTab({ onSaveAsTemplate }: ComposeEmailTabProps) {
  const sendEmail = useSendEmail();
  const { data: templatesData } = useEmailTemplates({ pageSize: 100 });

  // Form state
  const [recipientType, setRecipientType] = useState<'individual' | 'group' | 'all'>('individual');
  const [emailInput, setEmailInput] = useState('');
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ role?: string; kyc_status?: string; is_banned?: string }>({});
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [replyMode, setReplyMode] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [showCta, setShowCta] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Recipient preview for group/all
  const recipientPreview = useRecipientPreview(
    recipientType === 'group' ? filters : {}
  );

  // All users count
  const allUsersPreview = useRecipientPreview(
    recipientType === 'all' ? { role: 'all' } : {}
  );

  const handleAddEmail = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = emailInput.trim().replace(/,$/, '');
      if (email && email.includes('@') && !recipientEmails.includes(email)) {
        setRecipientEmails((prev) => [...prev, email]);
        setEmailInput('');
      }
    }
  }, [emailInput, recipientEmails]);

  const handleRemoveEmail = (email: string) => {
    setRecipientEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const defaultMode = CATEGORY_DEFAULT_REPLY_MODE[value];
    if (defaultMode) {
      setReplyMode(defaultMode);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'none') {
      return;
    }
    const template = templatesData?.data?.find((t: EmailTemplate) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
      setCategory(template.category);
      setReplyMode(template.reply_mode);
      setCtaLabel(template.cta_label || '');
      setCtaUrl(template.cta_url_template || '');
      if (template.cta_label || template.cta_url_template) {
        setShowCta(true);
      }
    }
  };

  const getRecipientCount = () => {
    if (recipientType === 'individual') return recipientEmails.length;
    if (recipientType === 'group') return recipientPreview.data?.count || 0;
    return allUsersPreview.data?.count || 0;
  };

  const canSend = () => {
    if (!subject.trim() || !content.trim() || !category || !replyMode) return false;
    if (recipientType === 'individual' && recipientEmails.length === 0) return false;
    if (recipientType === 'group' && getRecipientCount() === 0) return false;
    return true;
  };

  const handleSend = () => {
    if (!canSend()) return;
    setConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    const payload: SendEmailPayload = {
      recipientType,
      subject,
      content,
      category,
      replyMode,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
      templateId: selectedTemplateId !== 'none' ? selectedTemplateId : undefined,
    };

    if (recipientType === 'individual') {
      payload.recipientEmails = recipientEmails;
    } else if (recipientType === 'group') {
      payload.filters = {
        role: filters.role || undefined,
        kyc_status: filters.kyc_status || undefined,
        is_banned: filters.is_banned === 'true' ? true : undefined,
      };
    }

    if (recipientType === 'all') {
      payload.confirmationPhrase = confirmationPhrase;
    }

    sendEmail.mutate(payload, {
      onSuccess: () => {
        setConfirmOpen(false);
        setConfirmationPhrase('');
        // Reset form
        setRecipientEmails([]);
        setSubject('');
        setContent('');
        setCtaLabel('');
        setCtaUrl('');
        setShowCta(false);
        setSelectedTemplateId('');
      },
      onSettled: () => {
        setConfirmOpen(false);
      },
    });
  };

  const handleSendTest = () => {
    sendEmail.mutate({
      recipientType: 'individual',
      subject,
      content,
      category,
      replyMode,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
      testMode: true,
    });
  };

  const handleSaveAsTemplate = () => {
    if (!subject.trim() || !content.trim()) return;
    onSaveAsTemplate?.({
      name: subject,
      subject,
      content,
      category: category || 'custom',
      replyMode: replyMode || 'no_reply',
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Loader */}
      <div className="space-y-2">
        <Label>Load from Template</Label>
        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template to prefill..." />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[100]">
            <SelectItem value="none">None</SelectItem>
            {templatesData?.data?.map((t: EmailTemplate) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipient Type */}
      <div className="space-y-2">
        <Label>Recipients <span className="text-action-red">*</span></Label>
        <div className="flex gap-2">
          {(['individual', 'group', 'all'] as const).map((type) => (
            <Button
              key={type}
              variant={recipientType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecipientType(type)}
            >
              {type === 'individual' ? 'Individual' : type === 'group' ? 'Filtered Group' : 'All Users'}
            </Button>
          ))}
        </div>
      </div>

      {/* Individual Emails */}
      {recipientType === 'individual' && (
        <div className="space-y-2">
          <Label>Email Addresses</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recipientEmails.map((email) => (
              <Badge key={email} variant="secondary" className="gap-1 pr-1">
                {email}
                <button onClick={() => handleRemoveEmail(email)} className="hover:text-action-red">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Type email and press Enter..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleAddEmail}
          />
        </div>
      )}

      {/* Group Filters */}
      {recipientType === 'group' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={filters.role || ''} onValueChange={(v) => setFilters((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">KYC Status</Label>
              <Select value={filters.kyc_status || ''} onValueChange={(v) => setFilters((p) => ({ ...p, kyc_status: v }))}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banned</Label>
              <Select value={filters.is_banned || ''} onValueChange={(v) => setFilters((p) => ({ ...p, is_banned: v }))}>
                <SelectTrigger><SelectValue placeholder="Not banned" /></SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="false">Not Banned</SelectItem>
                  <SelectItem value="true">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {recipientPreview.isLoading ? (
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <Loader2 className="h-3 w-3 animate-spin" /> Counting recipients...
            </div>
          ) : recipientPreview.data ? (
            <div className="text-sm text-text-secondary">
              Will send to <strong>{recipientPreview.data.count}</strong> users
              {recipientPreview.data.preview.length > 0 && (
                <span className="text-text-tertiary"> ({recipientPreview.data.preview.join(', ')}{recipientPreview.data.count > 5 ? '...' : ''})</span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* All Users */}
      {recipientType === 'all' && (
        <div className="flex items-start gap-2 text-xs bg-action-red/10 text-action-red p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            This will send to <strong>all active users</strong>
            {allUsersPreview.data && ` (${allUsersPreview.data.count} recipients)`}.
            Please double-check the content before sending.
          </p>
        </div>
      )}

      {/* Category & Reply Mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category <span className="text-action-red">*</span></Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Reply Mode <span className="text-action-red">*</span></Label>
          <Select value={replyMode} onValueChange={setReplyMode}>
            <SelectTrigger><SelectValue placeholder="Select reply mode..." /></SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              {REPLY_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label>Subject <span className="text-action-red">*</span></Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Content <span className="text-action-red">*</span></Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Email body content..."
          rows={12}
        />
        <p className="text-xs text-text-tertiary">Use double line breaks for new paragraphs.</p>
      </div>

      {/* CTA Section */}
      <div className="space-y-2">
        <button
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          onClick={() => setShowCta(!showCta)}
        >
          {showCta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Call-to-Action Button (optional)
        </button>
        {showCta && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Button Label</Label>
              <Input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g., Open Dashboard"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button URL</Label>
              <Input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="e.g., /settings/kyc"
              />
              {ctaUrl && !ctaUrl.startsWith('https://') && !ctaUrl.startsWith('/') && (
                <p className="text-xs text-action-red">URL must start with https:// or /</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-bg-tertiary">
        <Button
          onClick={handleSend}
          disabled={!canSend() || sendEmail.isPending}
        >
          {sendEmail.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Send Email</>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendTest}
          disabled={!subject.trim() || !content.trim() || !category || !replyMode || sendEmail.isPending}
        >
          <TestTube className="h-4 w-4 mr-1" /> Send Test to Myself
        </Button>
        {onSaveAsTemplate && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsTemplate}
            disabled={!subject.trim() || !content.trim()}
          >
            Save as Template
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              Review the details before sending.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Category</span>
              <Badge variant="info">{category}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Reply Mode</span>
              <Badge variant="outline">{replyMode?.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Recipients</span>
              <span className="font-medium">{getRecipientCount()} user(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Subject</span>
              <span className="font-medium truncate max-w-[250px]">{subject}</span>
            </div>
            {recipientType === 'all' && (
              <div className="space-y-2 mt-2">
                <Label className="text-xs font-medium">
                  Type <span className="font-mono text-action-red">SEND TO ALL USERS</span> to confirm
                </Label>
                <Input
                  value={confirmationPhrase}
                  onChange={(e) => setConfirmationPhrase(e.target.value)}
                  placeholder="SEND TO ALL USERS"
                  className="font-mono"
                />
              </div>
            )}
            <div className="flex items-start gap-2 text-xs bg-brand-primary/10 text-brand-primary p-3 rounded-lg mt-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>This will send now and cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sendEmail.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={sendEmail.isPending || (recipientType === 'all' && confirmationPhrase !== 'SEND TO ALL USERS')}
            >
              {sendEmail.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
              ) : (
                'Confirm & Send'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
