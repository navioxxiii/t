import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
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

    const adminClient = createAdminClient();

    // Get request body
    const body = await request.json();

    // Validate required fields
    const {
      requested_tier,
      full_name,
      date_of_birth,
      nationality,
      address_line_1,
      city,
      postal_code,
      country,
    } = body;

    if (
      !requested_tier ||
      !full_name ||
      !date_of_birth ||
      !nationality ||
      !address_line_1 ||
      !city ||
      !postal_code ||
      !country
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['tier_1_basic', 'tier_2_advanced'].includes(requested_tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate age (18+)
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      );
    }

    const age = Math.floor(
      (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old' },
        { status: 400 }
      );
    }

    // For Tier 1, validate documents are provided
    if (requested_tier === 'tier_1_basic') {
      if (!body.id_document_type || !body.id_document_front_url || !body.selfie_url) {
        return NextResponse.json(
          { error: 'Missing required documents for Tier 1' },
          { status: 400 }
        );
      }

      // Validate ID document type
      if (
        !['passport', 'drivers_license', 'national_id'].includes(
          body.id_document_type
        )
      ) {
        return NextResponse.json(
          { error: 'Invalid ID document type' },
          { status: 400 }
        );
      }

      // For non-passport documents, back photo is required
      if (
        body.id_document_type !== 'passport' &&
        !body.id_document_back_url
      ) {
        return NextResponse.json(
          { error: 'ID document back is required for this document type' },
          { status: 400 }
        );
      }
    }

    // Check if user already has a pending/under_review submission
    const { data: existingSubmission, error: checkError } = await adminClient
      .from('kyc_submissions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'under_review'])
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('Error checking existing submission:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing submission' },
        { status: 500 }
      );
    }

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: 'You already have a pending KYC submission. Please wait for review.',
        },
        { status: 400 }
      );
    }

    // Get client IP and user agent for fraud detection
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('[KYC Submit] Creating submission with data:', {
      requested_tier,
      full_name: full_name.trim(),
      date_of_birth,
      nationality: nationality.trim(),
      id_document_type: body.id_document_type,
      has_id_front: !!body.id_document_front_url,
      has_id_back: !!body.id_document_back_url,
      has_selfie: !!body.selfie_url,
    });

    // Create KYC submission
    const submissionData = {
      user_id: user.id,
      requested_tier,
      full_name: full_name.trim(),
      date_of_birth,
      nationality: nationality.trim(),
      phone_number: body.phone_number?.trim() || null,
      address_line_1: address_line_1.trim(),
      address_line_2: body.address_line_2?.trim() || null,
      city: city.trim(),
      state_province: body.state_province?.trim() || null,
      postal_code: postal_code.trim(),
      country: country.trim(),
      id_document_type: body.id_document_type || null,
      id_document_front_url: body.id_document_front_url || null,
      id_document_back_url: body.id_document_back_url || null,
      selfie_url: body.selfie_url || null,
      proof_of_address_url: body.proof_of_address_url || null,
      status: 'pending',
      ip_address: ip,
      user_agent: userAgent,
    };

    const { data: submission, error: insertError } = await adminClient
      .from('kyc_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating submission:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        submissionData: {
          ...submissionData,
          // Redact URLs for privacy
          id_document_front_url: submissionData.id_document_front_url ? '[REDACTED]' : null,
          id_document_back_url: submissionData.id_document_back_url ? '[REDACTED]' : null,
          selfie_url: submissionData.selfie_url ? '[REDACTED]' : null,
        },
      });
      return NextResponse.json(
        { error: insertError.message || 'Failed to submit KYC application' },
        { status: 500 }
      );
    }

    // Update user profile KYC status
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile kyc_status:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        userId: user.id,
      });
      // Don't fail the request if profile update fails
    }

    // TODO: Send notification email to user
    // TODO: Send notification to admin for review

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        requested_tier: submission.requested_tier,
        created_at: submission.created_at,
      },
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
