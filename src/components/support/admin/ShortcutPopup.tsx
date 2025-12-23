/**
 * Shortcut Popup Component
 * Displays available template shortcuts when "/" is typed in reply textarea
 */

'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Template } from './TemplateSelector';

interface ShortcutPopupProps {
  templates: Template[];
  filter: string; // The text after "/" (e.g., "hi" for "/hi")
  selectedIndex: number;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function ShortcutPopup({
  templates,
  filter,
  selectedIndex,
  onSelect,
  onClose,
}: ShortcutPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Filter templates that have shortcuts and match the filter
  const filteredTemplates = templates.filter((t) => {
    if (!t.shortcut) return false;
    const shortcutWithoutSlash = t.shortcut.replace('/', '').toLowerCase();
    const filterLower = filter.toLowerCase();
    return shortcutWithoutSlash.startsWith(filterLower) ||
           t.title.toLowerCase().includes(filterLower);
  });

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (filteredTemplates.length === 0) {
    return (
      <div
        ref={listRef}
        className="absolute bottom-full left-0 right-0 mb-2 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg z-50 p-3"
      >
        <p className="text-sm text-text-tertiary text-center">
          No shortcuts match "/{filter}"
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-bg-tertiary bg-bg-tertiary/30">
        <p className="text-xs text-text-tertiary">
          Select a template or keep typing to filter
        </p>
      </div>

      {/* List */}
      <div className="max-h-[200px] overflow-y-auto">
        {filteredTemplates.map((template, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={template.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onSelect(template)}
              className={cn(
                'w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition-colors',
                isSelected
                  ? 'bg-brand-primary/10 text-text-primary'
                  : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="text-brand-primary text-sm">▸</span>
                  )}
                  <span className={cn(
                    'font-medium text-sm truncate',
                    isSelected && 'text-brand-primary'
                  )}>
                    {template.title}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary truncate mt-0.5 pl-4">
                  {template.content.slice(0, 60)}{template.content.length > 60 ? '...' : ''}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                {template.shortcut}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-bg-tertiary bg-bg-tertiary/30">
        <p className="text-xs text-text-tertiary">
          <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px] font-mono">↑↓</kbd>
          {' '}navigate{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px] font-mono">Enter</kbd>
          {' '}select{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px] font-mono">Esc</kbd>
          {' '}close
        </p>
      </div>
    </div>
  );
}
