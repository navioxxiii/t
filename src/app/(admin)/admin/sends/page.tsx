/**
 * Send Approval Queue Page
 * Two-tier approval system:
 * - Admins can review and approve (but not send)
 * - Super Admins can approve AND send crypto
 */

'use client';

import {
  usePendingSends,
  useAdminApproveSend,
  useSuperAdminApproveSend,
  useRejectSend,
  useMarkSentManual,
  parseAdminError,
  type PendingSend,
} from '@/hooks/useAdmin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCheck,
  Send,
  UserCheck,
  ShieldCheck,
  Copy,
  Zap,
  Hand,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function SendsPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePendingSends();
  const profile = useAuthStore((state) => state.profile);
  const authLoading = useAuthStore((state) => state.loading);
  const adminApproveMutation = useAdminApproveSend();
  const superAdminApproveMutation = useSuperAdminApproveSend();
  const markSentManualMutation = useMarkSentManual();
  const rejectMutation = useRejectSend();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [adminApproveConfirmOpen, setAdminApproveConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingSend | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [txHash, setTxHash] = useState('');

  // Show loading UI while profile is being fetched
  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Wait for profile before determining role (no dangerous defaults!)
  const userRole = profile?.role;
  const isAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'super_admin';

  // Safety check: Ensure valid admin/super_admin role
  if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Access denied. Admin or Super Admin role required.
          <br />
          <span className="text-xs mt-1 block">Current role: {userRole || 'unknown'}</span>
        </AlertDescription>
      </Alert>
    );
  }

  const handleAdminApprove = (requestId: string) => {
    const request = pendingSends.find((r) => r.id === requestId);
    if (!request) return;

    setSelectedRequest(request);
    setAdminApproveConfirmOpen(true);
  };

  const confirmAdminApprove = () => {
    if (!selectedRequest) return;

    toast.loading('Approving transaction...', { id: selectedRequest.id });
    setAdminApproveConfirmOpen(false);

    adminApproveMutation.mutate(
      { requestId: selectedRequest.id },
      {
        onSuccess: () => {
          toast.success('Transaction approved! Awaiting super admin to send.', {
            id: selectedRequest.id,
          });
          setSelectedRequest(null);
        },
        onError: (error) => {
          const parsedError = parseAdminError(error);
          toast.error(parsedError.message, { id: selectedRequest.id });
        },
      }
    );
  };

  const handleSuperAdminProcess = (request: PendingSend) => {
    setSelectedRequest(request);
    setTxHash('');
    setProcessModalOpen(true);
  };

  const handleSendAutomatic = async () => {
    if (!selectedRequest) return;

    toast.loading('Sending crypto via Plisio...', { id: selectedRequest.id });
    setProcessModalOpen(false);

    superAdminApproveMutation.mutate(
      { requestId: selectedRequest.id },
      {
        onSuccess: () => {
          toast.success('Transaction sent automatically via Plisio!', {
            id: selectedRequest.id,
          });
          setSelectedRequest(null);
        },
        onError: (error) => {
          const parsedError = parseAdminError(error);
          toast.error(parsedError.message, { id: selectedRequest.id });
        },
      }
    );
  };

  const handleMarkSentManual = async () => {
    if (!selectedRequest) return;

    toast.loading('Marking as sent manually...', { id: selectedRequest.id });
    setProcessModalOpen(false);

    markSentManualMutation.mutate(
      { requestId: selectedRequest.id, txHash: txHash || undefined },
      {
        onSuccess: () => {
          toast.success('Transaction marked as sent!', {
            id: selectedRequest.id,
          });
          setSelectedRequest(null);
          setTxHash('');
        },
        onError: (error) => {
          const parsedError = parseAdminError(error);
          toast.error(parsedError.message, {
            id: selectedRequest.id,
          });
        },
      }
    );
  };

  const handleReject = (request: PendingSend) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    toast.loading('Rejecting send...', { id: selectedRequest.id });

    rejectMutation.mutate(
      {
        requestId: selectedRequest.id,
        reason: rejectionReason,
      },
      {
        onSuccess: () => {
          toast.success('Send request rejected', { id: selectedRequest.id });
          setRejectModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason('');
        },
        onError: (error) => {
          const parsedError = parseAdminError(error);
          toast.error(parsedError.message, { id: selectedRequest.id });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Failed to load pending sends: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  const pendingSends = data?.pendingSends || [];

  // Separate by status
  const pendingRequests = pendingSends.filter((s) => s.status === 'pending');
  const adminApprovedRequests = pendingSends.filter(
    (s) => s.status === 'admin_approved'
  );
  const internalTransferCount = pendingSends.filter((s) => s.is_internal_transfer).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Send Approvals</h1>
          <p className="text-text-secondary mt-1">
            {isSuperAdmin
              ? 'Review and send approved transactions'
              : 'Review and approve pending send requests'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className="bg-brand-primary/10 text-brand-primary border-brand-primary/20"
            >
              {isSuperAdmin ? (
                <>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Super Admin
                </>
              ) : isAdmin ? (
                <>
                  <UserCheck className="w-3 h-3 mr-1" />
                  Admin
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {userRole || 'Loading...'}
                </>
              )}
            </Badge>
            {/* Debug: Show actual role */}
            {process.env.NODE_ENV === 'development' && (
              <Badge variant="outline" className="bg-bg-tertiary text-text-tertiary text-xs">
                Role: {userRole}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="border-bg-tertiary text-text-primary hover:bg-bg-tertiary"
        >
          {isRefetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', isSuperAdmin && 'lg:grid-cols-4')}>
        {/* Pending Review — all roles */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-bg-tertiary flex items-center gap-5">
          <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {pendingRequests.length}{' '}
              <span className="text-sm font-normal text-text-tertiary">Requests</span>
            </p>
          </div>
        </div>

        {/* Ready to Send — super admin only */}
        {isSuperAdmin && (
          <div className="bg-bg-secondary p-6 rounded-xl border border-bg-tertiary flex items-center gap-5">
            <div className="size-12 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                Ready to Send
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {adminApprovedRequests.length}{' '}
                <span className="text-sm font-normal text-text-tertiary">Requests</span>
              </p>
            </div>
          </div>
        )}

        {/* Internal Transfers — super admin only */}
        {isSuperAdmin && (
          <div className="bg-bg-secondary p-6 rounded-xl border border-bg-tertiary flex items-center gap-5">
            <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                Internal Transfers
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {internalTransferCount}{' '}
                <span className="text-sm font-normal text-text-tertiary">Requests</span>
              </p>
            </div>
          </div>
        )}

        {/* Total Queued — all roles */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-bg-tertiary flex items-center gap-5">
          <div className="size-12 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
              Total Queued
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {pendingSends.length}{' '}
              <span className="text-sm font-normal text-text-tertiary">Total</span>
            </p>
          </div>
        </div>
      </div>

      {/* Admin Approved Requests (Super Admin Only) */}
      {isSuperAdmin && adminApprovedRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-action-green" />
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Ready to Send
              <span className="bg-action-green/10 text-action-green text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                Queue: Ready
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {adminApprovedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userRole={userRole}
                onProcess={handleSuperAdminProcess}
                onReject={handleReject}
                isProcessing={
                  superAdminApproveMutation.isPending ||
                  markSentManualMutation.isPending ||
                  rejectMutation.isPending
                }
              />
            ))}
            {adminApprovedRequests.length % 3 !== 0 && <EmptyPlaceholderCard />}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            Pending Review
            <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
              Awaiting Approval
            </span>
          </h3>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="bg-bg-secondary border-bg-tertiary py-16 text-center">
            <div className="size-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-text-tertiary" />
            </div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
              All caught up!
            </p>
            <p className="text-xs text-text-tertiary mt-1 max-w-[180px] mx-auto">
              Cards will appear when users submit withdrawal requests.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userRole={userRole}
                onApprove={handleAdminApprove}
                onProcess={handleSuperAdminProcess}
                onReject={handleReject}
                isProcessing={
                  adminApproveMutation.isPending ||
                  superAdminApproveMutation.isPending ||
                  markSentManualMutation.isPending ||
                  rejectMutation.isPending
                }
              />
            ))}
            {pendingRequests.length % 3 !== 0 && <EmptyPlaceholderCard />}
          </div>
        )}
      </div>

      {/* Admin Approve Confirmation */}
      {selectedRequest && (
        <ConfirmActionDialog
          open={adminApproveConfirmOpen}
          onOpenChange={setAdminApproveConfirmOpen}
          onConfirm={confirmAdminApprove}
          title="Approve Withdrawal Request"
          description="This will approve the withdrawal and send it to the super admin queue for processing."
          details={[
            { label: 'User', value: selectedRequest.profiles.email },
            {
              label: 'Amount',
              value: `${selectedRequest.amount} ${selectedRequest.coin_symbol}`,
              highlight: true,
            },
            { label: 'To Address', value: selectedRequest.to_address.substring(0, 20) + '...' },
          ]}
          confirmText="Approve"
          variant="default"
          loading={adminApproveMutation.isPending}
        />
      )}

      {/* Process Modal (Super Admin) */}
      <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Choose how to process this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="p-4 bg-bg-tertiary rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Amount</span>
                  <span className="font-semibold text-text-primary">
                    {selectedRequest.amount} {selectedRequest.coin_symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">User</span>
                  <span className="text-sm text-text-primary">
                    {selectedRequest.profiles.email}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleSendAutomatic}
                className="w-full bg-action-green hover:bg-action-green/90 text-white gap-2"
                disabled={superAdminApproveMutation.isPending}
              >
                <Zap className="w-4 h-4" />
                Send Automatically via Plisio
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-bg-tertiary" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-bg-secondary px-2 text-text-tertiary">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                <Input
                  id="txHash"
                  placeholder="Enter transaction hash if already sent..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
              </div>

              <Button
                onClick={handleMarkSentManual}
                variant="outline"
                className="w-full gap-2"
                disabled={markSentManualMutation.isPending}
              >
                <Hand className="w-4 h-4" />
                Mark as Sent Manually
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setProcessModalOpen(false)}
              disabled={
                superAdminApproveMutation.isPending || markSentManualMutation.isPending
              }
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Send Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this send request. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Invalid address, suspicious activity, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyPlaceholderCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-bg-tertiary bg-bg-secondary/50 flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="size-12 rounded-full bg-bg-tertiary flex items-center justify-center mb-3">
        <Layers className="w-5 h-5 text-text-tertiary" />
      </div>
      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
        Awaiting Requests
      </p>
      <p className="text-[11px] text-text-tertiary mt-1 max-w-[140px]">
        New requests will appear here
      </p>
    </div>
  );
}

// Request Card Component
function RequestCard({
  request,
  userRole,
  onApprove,
  onProcess,
  onReject,
  isProcessing,
}: {
  request: PendingSend;
  userRole: string;
  onApprove?: (id: string) => void;
  onProcess?: (request: PendingSend) => void;
  onReject: (request: PendingSend) => void;
  isProcessing: boolean;
}) {
  const isAdminApproved = request.status === 'admin_approved';
  const isSuperAdmin = userRole === 'super_admin';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
  };

  const initials = request.profiles.full_name
    ? request.profiles.full_name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : request.profiles.email.slice(0, 2).toUpperCase();

  const isHighValue = parseFloat(String(request.amount)) >= 1000;

  return (
    <div
      className={cn(
        'bg-bg-secondary rounded-xl border flex flex-col overflow-hidden',
        isAdminApproved ? 'border-action-green/30' : 'border-bg-tertiary'
      )}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-bg-tertiary flex justify-between items-start">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0 text-brand-primary text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm leading-tight truncate">
              {request.profiles.full_name || request.profiles.email}
            </p>
            <p className="text-xs text-text-tertiary truncate">{request.profiles.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="bg-bg-tertiary text-text-secondary text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {request.coin_symbol}
          </span>
          {request.is_internal_transfer && (
            <span className="bg-blue-500/10 text-blue-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              Internal
            </span>
          )}
          {isHighValue && !request.is_internal_transfer && (
            <span className="bg-amber-500/10 text-amber-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              High Value
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4 flex-1">
        {/* Amount row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-tertiary mb-0.5">Request Amount</p>
            <p className="text-2xl font-bold text-text-primary leading-tight">
              {request.amount}{' '}
              <span className="text-base font-semibold text-text-secondary">
                {request.coin_symbol}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-0.5">Network Fee</p>
            <p className="text-sm font-semibold text-text-primary">
              {request.transactions.network_fee || '0'}{' '}
              <span className="text-text-secondary font-normal">{request.coin_symbol}</span>
            </p>
          </div>
        </div>

        {/* Admin-approved banner */}
        {isAdminApproved && (
          <div className="flex items-center gap-2 p-3 bg-action-green/10 rounded-lg border border-action-green/20">
            <CheckCheck className="w-4 h-4 text-action-green shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-action-green">Admin Approved</p>
              <p className="text-[11px] text-text-secondary truncate">
                By {request.admin_approver?.email || 'Unknown'}
              </p>
            </div>
            {request.processing_type && (
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                  request.processing_type === 'automatic'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-orange-500/10 text-orange-500'
                )}
              >
                {request.processing_type === 'automatic' ? 'Auto' : 'Manual'}
              </span>
            )}
          </div>
        )}

        {/* Internal transfer banner */}
        {request.is_internal_transfer && request.recipient && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <ArrowLeftRight className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-blue-500">Internal Transfer</p>
              <p className="text-[11px] text-text-secondary truncate">
                To: {request.recipient.email}
              </p>
            </div>
          </div>
        )}

        {/* Address box */}
        <div className="bg-bg-tertiary/50 p-3 rounded-lg border border-bg-tertiary">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
              To Address
            </p>
            <button
              onClick={() => copyToClipboard(request.to_address)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
              title="Copy address"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-mono text-xs text-text-secondary break-all leading-relaxed">
            {request.to_address}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          <Clock className="w-3 h-3" />
          <span>{new Date(request.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 bg-bg-tertiary/30 flex gap-3">
        {isAdminApproved && isSuperAdmin ? (
          // Super admin processing admin-approved request
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={() => onProcess?.(request)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Process Withdrawal
          </Button>
        ) : isSuperAdmin ? (
          // Super admin can directly process pending request
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={() => onProcess?.(request)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Process Withdrawal
          </Button>
        ) : (
          // Regular admin can only approve
          <Button
            className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-light"
            onClick={() => onApprove?.(request.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Approve
          </Button>
        )}
        <Button
          className="flex-1 bg-action-red/10 hover:bg-action-red text-action-red hover:text-white border border-action-red/20 transition-colors"
          onClick={() => onReject(request)}
          disabled={isProcessing}
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  );
}
