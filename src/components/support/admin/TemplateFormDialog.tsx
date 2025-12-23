/**
 * Template Form Dialog
 * Dialog for creating and editing response templates
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  is_global: boolean;
}

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null; // null = create mode, Template = edit mode
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'account', label: 'Account' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'kyc', label: 'KYC' },
  { value: 'technical', label: 'Technical' },
  { value: 'closing', label: 'Closing' },
];

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: TemplateFormDialogProps) {
  const isEditMode = !!template;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [shortcut, setShortcut] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setTitle(template.title);
        setContent(template.content);
        setCategory(template.category || '');
        setShortcut(template.shortcut || '');
        setIsGlobal(template.is_global);
      } else {
        setTitle('');
        setContent('');
        setCategory('');
        setShortcut('');
        setIsGlobal(true);
      }
    }
  }, [open, template]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    // Validate shortcut format
    if (shortcut && !shortcut.startsWith('/')) {
      toast.error('Shortcut must start with /');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/admin/support/templates/${template.id}`
        : '/api/admin/support/templates';

      const response = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category || null,
          shortcut: shortcut.trim() || null,
          is_global: isGlobal,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      toast.success(isEditMode ? 'Template updated' : 'Template created');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the response template details.'
              : 'Create a new canned response template for quick replies.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Greeting"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Template message content..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortcut">Shortcut</Label>
              <Input
                id="shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="e.g., /hi"
                maxLength={20}
              />
              <p className="text-xs text-text-tertiary">
                Type this in reply box to quick-insert
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_global">Global Template</Label>
              <p className="text-xs text-text-tertiary">
                Available to all admins
              </p>
            </div>
            <Switch
              id="is_global"
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
