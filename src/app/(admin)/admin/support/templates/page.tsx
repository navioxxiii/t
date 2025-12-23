/**
 * Templates Management Page
 * CRUD interface for managing response templates
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  Globe,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { TemplateFormDialog } from '@/components/support/admin/TemplateFormDialog';
import { useAuthStore } from '@/stores/authStore';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  is_global: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  creator?: {
    email: string;
    full_name: string | null;
  };
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'account', label: 'Account' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'kyc', label: 'KYC' },
  { value: 'technical', label: 'Technical' },
  { value: 'closing', label: 'Closing' },
];

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isSuperAdmin = profile?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: ['support-templates', categoryFilter],
    queryFn: async () => {
      const url = categoryFilter
        ? `/api/admin/support/templates?category=${categoryFilter}`
        : '/api/admin/support/templates';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const templates: Template[] = data?.templates || [];

  // Filter by search
  const filteredTemplates = templates.filter((t) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(searchLower) ||
      t.content.toLowerCase().includes(searchLower) ||
      t.shortcut?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/support/templates/${deletingTemplate.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['support-templates'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['support-templates'] });
    setEditingTemplate(null);
  };

  const canEdit = (template: Template) => {
    return isSuperAdmin || template.created_by === user?.id;
  };

  const canDelete = isSuperAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/support"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Support
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-bg-tertiary rounded-lg">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Response Templates</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage canned responses for quick replies
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={() => { setEditingTemplate(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Shortcut</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-text-tertiary" />
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-text-secondary">
                      {search || categoryFilter
                        ? 'No templates match your filters'
                        : 'No templates yet. Create one to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-text-primary">{template.title}</p>
                          <p className="text-xs text-text-tertiary line-clamp-1 max-w-[200px]">
                            {template.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.category && (
                          <Badge variant="outline" className="capitalize">
                            {template.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.shortcut && (
                          <Badge variant="secondary" className="font-mono">
                            {template.shortcut}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.is_global ? (
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <Globe className="h-3 w-3" />
                            Global
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <User className="h-3 w-3" />
                            Personal
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-text-secondary">
                          {template.usage_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-text-tertiary">
                          {template.creator?.full_name || template.creator?.email || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(template) && (
                              <DropdownMenuItem onClick={() => handleEdit(template)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingTemplate(template);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTemplate?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
