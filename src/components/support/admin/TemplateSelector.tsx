/**
 * Template Selector Component
 * Dropdown for selecting canned response templates in admin reply textarea
 */

'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  usage_count: number;
}

interface TemplateSelectorProps {
  templates: Template[];
  isLoading?: boolean;
  onSelect: (content: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({ templates, isLoading, onSelect, disabled }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) => {
    const searchLower = search.toLowerCase();
    return (
      template.title.toLowerCase().includes(searchLower) ||
      template.content.toLowerCase().includes(searchLower) ||
      template.shortcut?.toLowerCase().includes(searchLower) ||
      template.category?.toLowerCase().includes(searchLower)
    );
  });

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const handleSelect = async (template: Template) => {
    onSelect(template.content);
    setOpen(false);
    setSearch('');

    // Increment usage count in background
    try {
      await fetch(`/api/admin/support/templates/${template.id}`, {
        method: 'POST',
      });
    } catch {
      // Ignore errors for usage tracking
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-bg-tertiary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary text-sm">
              {search ? 'No templates match your search' : 'No templates available'}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md transition-colors',
                          'hover:bg-bg-tertiary focus:bg-bg-tertiary focus:outline-none'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-text-primary truncate">
                            {template.title}
                          </span>
                          {template.shortcut && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {template.shortcut}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
                          {template.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-bg-tertiary bg-bg-secondary/50">
          <p className="text-xs text-text-tertiary text-center">
            Type shortcut (e.g., /hi) in reply box to quick-insert
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
