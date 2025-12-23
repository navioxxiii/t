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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Clock className="w-5 h-5 text-brand-primary" />
              Pending Review: {pendingRequests.length}
            </CardTitle>
          </CardHeader>
        </Card>

        {isSuperAdmin && (
          <Card className="bg-bg-secondary border-brand-primary/20 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <CheckCheck className="w-5 h-5 text-action-green" />
                Ready to Send: {adminApprovedRequests.length}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Admin Approved Requests (Super Admin Only) */}
      {isSuperAdmin && adminApprovedRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-action-green" />
            <h2 className="text-xl font-semibold text-text-primary">
              Ready to Send ({adminApprovedRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
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
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 w-5 text-brand-primary" />
          <h2 className="text-xl font-semibold text-text-primary">
            Pending Review ({pendingRequests.length})
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="bg-bg-secondary border-bg-tertiary">
            <CardContent className="py-12 text-center">
              <Check className="w-12 h-12 mx-auto mb-4 text-action-green" />
              <p className="text-lg font-semibold text-text-primary">
                All caught up!
              </p>
              <p className="text-text-secondary">
                No pending send requests at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
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

  return (
    <Card
      className={`bg-bg-secondary ${isAdminApproved ? 'border-action-green/30 border-2' : 'border-bg-tertiary'}`}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status Badge */}
          {isAdminApproved && (
            <div className="flex items-center gap-2 p-3 bg-action-green/10 rounded-lg border border-action-green/20">
              <CheckCheck className="w-5 h-5 text-action-green" />
              <div className="flex-1">
                <p className="text-sm font-medium text-action-green">
                  Admin Approved
                </p>
                <p className="text-xs text-text-secondary">
                  Approved by {request.admin_approver?.email || 'Unknown'} on{' '}
                  {request.admin_approved_at
                    ? new Date(request.admin_approved_at).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>
              {request.processing_type && (
                <Badge
                  variant="outline"
                  className={
                    request.processing_type === 'automatic'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }
                >
                  {request.processing_type === 'automatic' ? (
                    <>
                      <Zap className="w-3 h-3 mr-1" />
                      Auto
                    </>
                  ) : (
                    <>
                      <Hand className="w-3 h-3 mr-1" />
                      Manual
                    </>
                  )}
                </Badge>
              )}
            </div>
          )}

          {/* Internal Transfer Badge */}
          {request.is_internal_transfer && request.recipient && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="rounded-full bg-blue-500/20 p-2">
                <Copy className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-500">
                  Internal Transfer
                </p>
                <p className="text-xs text-text-secondary">
                  To: {request.recipient.email}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-500 border-blue-500/20"
              >
                In-App
              </Badge>
            </div>
          )}

          {/* User Info */}
          <div>
            <p className="text-sm text-text-secondary">Sender</p>
            <p className="font-semibold text-text-primary">
              {request.profiles.full_name || request.profiles.email}
            </p>
            <p className="text-xs text-text-tertiary">{request.profiles.email}</p>
          </div>

          {/* Transaction Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-text-secondary">Amount</p>
              <p className="text-lg font-bold text-text-primary">
                {request.amount} {request.coin_symbol}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Network Fee</p>
              <p className="font-medium text-text-primary">
                {request.transactions.network_fee || '0'} {request.coin_symbol}
              </p>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-text-secondary">To Address</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(request.to_address)}
                className="h-6 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="font-mono text-xs break-all text-text-primary">
              {request.to_address}
            </p>
          </div>

          {/* Timestamp */}
          <div>
            <p className="text-sm text-text-secondary">Requested</p>
            <p className="text-sm text-text-primary">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-bg-tertiary">
            {isAdminApproved && isSuperAdmin ? (
              // Super admin processing admin-approved request
              <Button
                className="flex-1 bg-action-green hover:bg-action-green/90 text-white"
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
                className="flex-1 bg-brand-primary text-bg-primary hover:bg-brand-primary-light"
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
                className="flex-1 bg-brand-primary text-bg-primary hover:bg-brand-primary-light"
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
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(request)}
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
