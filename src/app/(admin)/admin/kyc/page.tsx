/**
 * Admin KYC Review Dashboard
 * List and review KYC submissions
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Eye, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  user_email: string;
  full_name: string;
  requested_tier: string;
  status: string;
  created_at: string;
}

interface SubmissionDetail {
  id: string;
  user: {
    email: string;
  };
  full_name: string;
  date_of_birth: string;
  nationality: string;
  phone_number?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  requested_tier: string;
  status: string;
  id_document_type?: string;
  id_document_front_url?: string;
  id_document_back_url?: string;
  selfie_url?: string;
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDetail | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter
        ? `/api/admin/kyc/submissions?status=${filter}`
        : "/api/admin/kyc/submissions";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      } else {
        toast.error("Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const viewSubmission = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/kyc/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSubmission(data.submission);
        setReviewDialogOpen(true);
        setRejectionReason("");
        setAdminNotes("");
        setImageErrors(new Set()); // Reset image errors when viewing new submission
      } else {
        toast.error("Failed to load submission details");
      }
    } catch (error) {
      console.error("Error loading submission:", error);
      toast.error("Failed to load submission details");
    }
  };

  const reviewSubmission = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/kyc/${selectedSubmission?.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            rejection_reason: action === "reject" ? rejectionReason : null,
            admin_notes: adminNotes || null,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          action === "approve" ? "KYC approved successfully" : "KYC rejected"
        );
        setReviewDialogOpen(false);
        fetchSubmissions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to review submission");
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
      toast.error("Failed to review submission");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-brand-primary/10 text-brand-primary">
            Pending
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500/10 text-blue-500">Under Review</Badge>
        );
      case "approved":
        return (
          <Badge className="bg-action-green/10 text-action-green">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-action-red/10 text-action-red">Rejected</Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {["pending", "under_review", "approved", "rejected"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-tertiary">
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-bg-tertiary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {submission.user_email}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {submission.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {submission.requested_tier === "tier_1_basic"
                        ? "Basic"
                        : "Elite"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewSubmission(submission.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review KYC Submission</DialogTitle>
            <DialogDescription>
              Review the user&apos;s information and documents
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-bg-tertiary/30 rounded-lg">
                <div>
                  <p className="text-xs text-text-tertiary">Email</p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedSubmission.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Tier</p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedSubmission.requested_tier === "tier_1_basic"
                      ? "Basic Verification"
                      : "Elite Membership"}
                  </p>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary">Full Name</p>
                    <p className="text-text-primary">
                      {selectedSubmission.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">DOB</p>
                    <p className="text-text-primary">
                      {selectedSubmission.date_of_birth}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Nationality</p>
                    <p className="text-text-primary">
                      {selectedSubmission.nationality}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Phone</p>
                    <p className="text-text-primary">
                      {selectedSubmission.phone_number || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Address
                </h3>
                <p className="text-sm text-text-primary">
                  {selectedSubmission.address_line_1}
                  {selectedSubmission.address_line_2 &&
                    `, ${selectedSubmission.address_line_2}`}
                  <br />
                  {selectedSubmission.city}, {selectedSubmission.state_province}{" "}
                  {selectedSubmission.postal_code}
                  <br />
                  {selectedSubmission.country}
                </p>
              </div>

              {/* Documents (if Tier 2/Elite) */}
              {selectedSubmission.requested_tier === "tier_1_basic" && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Documents
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-2">
                        ID Type:{" "}
                        <span className="font-medium text-text-primary">
                          {selectedSubmission.id_document_type?.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubmission.id_document_front_url && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-2">
                            ID Front
                          </p>
                          <a
                            href={selectedSubmission.id_document_front_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border-2 border-bg-tertiary rounded-lg overflow-hidden hover:border-brand-primary transition-colors relative h-32"
                          >
                            {imageErrors.has("id_front") ? (
                              <div className="w-full h-32 flex items-center justify-center bg-bg-tertiary text-text-tertiary text-xs">
                                Failed to load image
                              </div>
                            ) : (
                              <Image
                                src={selectedSubmission.id_document_front_url}
                                alt="ID Front"
                                fill
                                className="object-cover"
                                onError={() => {
                                  setImageErrors((prev) =>
                                    new Set(prev).add("id_front")
                                  );
                                }}
                                unoptimized
                              />
                            )}
                          </a>
                        </div>
                      )}
                      {selectedSubmission.id_document_back_url && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-2">
                            ID Back
                          </p>
                          <a
                            href={selectedSubmission.id_document_back_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border-2 border-bg-tertiary rounded-lg overflow-hidden hover:border-brand-primary transition-colors relative h-32"
                          >
                            {imageErrors.has("id_back") ? (
                              <div className="w-full h-32 flex items-center justify-center bg-bg-tertiary text-text-tertiary text-xs">
                                Failed to load image
                              </div>
                            ) : (
                              <Image
                                src={selectedSubmission.id_document_back_url}
                                alt="ID Back"
                                fill
                                className="object-cover"
                                onError={() => {
                                  setImageErrors((prev) =>
                                    new Set(prev).add("id_back")
                                  );
                                }}
                                unoptimized
                              />
                            )}
                          </a>
                        </div>
                      )}
                      {selectedSubmission.selfie_url && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-2">
                            Selfie
                          </p>
                          <a
                            href={selectedSubmission.selfie_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border-2 border-bg-tertiary rounded-lg overflow-hidden hover:border-brand-primary transition-colors relative h-32"
                          >
                            {imageErrors.has("selfie") ? (
                              <div className="w-full h-32 flex items-center justify-center bg-bg-tertiary text-text-tertiary text-xs">
                                Failed to load image
                              </div>
                            ) : (
                              <Image
                                src={selectedSubmission.selfie_url}
                                alt="Selfie"
                                fill
                                className="object-cover"
                                onError={() => {
                                  setImageErrors((prev) =>
                                    new Set(prev).add("selfie")
                                  );
                                }}
                                unoptimized
                              />
                            )}
                          </a>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-text-tertiary italic">
                      Click images to view full size in new tab
                    </p>
                  </div>
                </div>
              )}

              {/* Review Form (only for pending/under_review) */}
              {(selectedSubmission.status === "pending" ||
                selectedSubmission.status === "under_review") && (
                <div className="space-y-4 pt-4 border-t border-bg-tertiary">
                  <div>
                    <Label>Admin Notes (Optional)</Label>
                    <Input
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this review..."
                    />
                  </div>

                  <div>
                    <Label>Rejection Reason (if rejecting)</Label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (visible to user)"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedSubmission &&
            (selectedSubmission.status === "pending" ||
              selectedSubmission.status === "under_review") ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => reviewSubmission("reject")}
                  disabled={submitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => reviewSubmission("approve")}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            ) : (
              <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
