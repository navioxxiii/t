/**
 * Password History Viewer Component
 * Shows password history for a user (super admin only)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, EyeOff, Loader2, Key, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface PasswordHistoryViewerProps {
  userId: string | null;
  userEmail: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordRecord {
  id: string;
  password: string;
  method: 'registration' | 'admin_creation' | 'password_reset' | 'password_change';
  setByUserId: string | null;
  createdAt: string;
}

const METHOD_LABELS = {
  registration: 'User Registration',
  admin_creation: 'Admin Created',
  password_reset: 'Password Reset',
  password_change: 'Password Changed',
};

const METHOD_COLORS = {
  registration: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  admin_creation: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  password_reset: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  password_change: 'bg-green-500/10 text-green-700 border-green-500/20',
};

export function PasswordHistoryViewer({ userId, userEmail, open, onOpenChange }: PasswordHistoryViewerProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PasswordRecord[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const fetchPasswordHistory = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/password-audit?user_id=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch password history');
      }

      setHistory(data.password_history || []);

      if (data.password_history.length === 0) {
        toast.info('No password history found for this user');
      }
    } catch (error) {
      console.error('Error fetching password history:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch password history'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && userId) {
      fetchPasswordHistory();
    } else {
      // Clear data and visible passwords when closing
      setHistory([]);
      setVisiblePasswords(new Set());
    }
  };

  const togglePasswordVisibility = (recordId: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  if (!userId || !userEmail) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Password History</DialogTitle>
          <DialogDescription>
            Viewing password history for: <strong>{userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Security Warning */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Security Critical Access
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                This action is being logged. Only access password history for legitimate
                compliance or audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {/* Password History List */}
        {!loading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((record) => {
              const isVisible = visiblePasswords.has(record.id);

              return (
                <div
                  key={record.id}
                  className="rounded-lg border border-bg-tertiary p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={METHOD_COLORS[record.method]}
                    >
                      {METHOD_LABELS[record.method]}
                    </Badge>
                    <span className="text-xs text-text-tertiary">
                      {format(new Date(record.createdAt), 'PPp')}
                    </span>
                  </div>

                  {/* Password Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm bg-bg-secondary p-3 rounded-md">
                      {isVisible ? record.password : '••••••••••••'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePasswordVisibility(record.id)}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPassword(record.password)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary">No password history found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
