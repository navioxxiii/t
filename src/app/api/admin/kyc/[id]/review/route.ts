import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or super_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { action, rejection_reason, admin_notes } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // If rejecting, rejection_reason is required
    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting' },
        { status: 400 }
      );
    }

    // Get submission
    const { data: submission, error: submissionError } = await supabase
      .from('kyc_submissions')
      .select('id, user_id, requested_tier, status')
      .eq('id', id)
      .single();

    if (submissionError) {
      if (submissionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to fetch submission' },
        { status: 500 }
      );
    }

    // Check if submission is already reviewed
    if (submission.status === 'approved' || submission.status === 'rejected') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Update submission status
    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('kyc_submissions')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: action === 'reject' ? rejection_reason : null,
        admin_notes: admin_notes || null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    // The trigger will automatically update the user's profile
    // But we'll verify it was updated correctly
    await new Promise(resolve => setTimeout(resolve, 100)); // Give trigger time to run

    const { data: updatedProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_tier')
      .eq('id', submission.user_id)
      .single();

    if (profileCheckError) {
      console.error('Error checking profile update:', profileCheckError);
    }

    // TODO: Send email notification to user about KYC decision
    // Template needed: KYCApprovalEmail and KYCRejectionEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', submission.user_id)
    //   .single();
    // if (userProfile) {
    //   if (action === 'approve') {
    //     await sendKYCApprovalEmail({
    //       email: userProfile.email,
    //       recipientName: userProfile.full_name || 'User',
    //       tier: updatedProfile?.kyc_tier || submission.requested_tier,
    //       limits: getKYCLimits(updatedProfile?.kyc_tier || submission.requested_tier),
    //     });
    //   } else {
    //     await sendKYCRejectionEmail({
    //       email: userProfile.email,
    //       recipientName: userProfile.full_name || 'User',
    //       rejectionReason: rejection_reason,
    //       resubmitUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/kyc`,
    //     });
    //   }
    // }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      profile_updated: updatedProfile ? {
        kyc_status: updatedProfile.kyc_status,
        kyc_tier: updatedProfile.kyc_tier,
      } : null,
    });
  } catch (error) {
    console.error('Admin KYC review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
