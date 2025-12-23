import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, under_review, approved, rejected
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('kyc_submissions')
      .select(`
        id,
        user_id,
        requested_tier,
        full_name,
        date_of_birth,
        nationality,
        status,
        created_at,
        reviewed_at,
        reviewed_by,
        profiles!inner(email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error: submissionsError, count } = await query;

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Get reviewer info for reviewed submissions
    const reviewedSubmissions = submissions.filter(s => s.reviewed_by);
    const reviewerIds = [...new Set(reviewedSubmissions.map(s => s.reviewed_by))];

    interface Reviewer {
      id: string;
      email: string;
      full_name: string | null;
    }

    let reviewers: Record<string, Reviewer> = {};
    if (reviewerIds.length > 0) {
      const { data: reviewerData, error: reviewerError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', reviewerIds);

      if (!reviewerError && reviewerData) {
        reviewers = Object.fromEntries(
          reviewerData.map(r => [r.id, r])
        );
      }
    }

    // Format response
    const formattedSubmissions = submissions.map(sub => {
      const profileData = sub.profiles as unknown as { email: string } | null;
      return {
        id: sub.id,
        user_id: sub.user_id,
        user_email: profileData?.email || '',
        requested_tier: sub.requested_tier,
        full_name: sub.full_name,
        date_of_birth: sub.date_of_birth,
        nationality: sub.nationality,
        status: sub.status,
        created_at: sub.created_at,
        reviewed_at: sub.reviewed_at,
        reviewed_by: sub.reviewed_by ? reviewers[sub.reviewed_by] : null,
      };
    });

    return NextResponse.json({
      submissions: formattedSubmissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin KYC submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
