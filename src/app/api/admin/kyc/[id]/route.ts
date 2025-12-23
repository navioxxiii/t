import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('kyc_submissions')
      .select(`
        *,
        profiles!inner(id, email, full_name, role)
      `)
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

    // Get reviewer info if reviewed
    let reviewer = null;
    if (submission.reviewed_by) {
      const { data: reviewerData, error: reviewerError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', submission.reviewed_by)
        .single();

      if (!reviewerError && reviewerData) {
        reviewer = reviewerData;
      }
    }

    // Helper function to create signed URL from storage path or full URL
    const createSignedUrl = async (url: string | null): Promise<string | null> => {
      if (!url) return null;
      
      let storagePath = url;
      
      // If it's a full Supabase storage URL, extract the path
      // Format: https://[project].supabase.co/storage/v1/object/public/kyc-documents/[path]
      // or: https://[project].supabase.co/storage/v1/object/sign/kyc-documents/[path]
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Try to extract path from Supabase storage URL
        const match = url.match(/\/kyc-documents\/(.+)$/);
        if (match && match[1]) {
          // Decode the path (URL might be encoded)
          storagePath = decodeURIComponent(match[1]);
        } else {
          // If we can't extract the path, return the URL as-is
          // It might be a working public URL or external URL
          return url;
        }
      }
      
      // Create signed URL from storage path
      // Signed URLs expire in 1 hour (3600 seconds)
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(storagePath, 3600);
      
      if (error || !data) {
        console.error('Error creating signed URL for', storagePath, error);
        // If signed URL creation fails, return the original URL as fallback
        return url;
      }
      
      return data.signedUrl;
    };

    // Create signed URLs for all document URLs
    const [
      idDocumentFrontUrl,
      idDocumentBackUrl,
      selfieUrl,
      proofOfAddressUrl,
    ] = await Promise.all([
      createSignedUrl(submission.id_document_front_url),
      createSignedUrl(submission.id_document_back_url),
      createSignedUrl(submission.selfie_url),
      createSignedUrl(submission.proof_of_address_url),
    ]);

    return NextResponse.json({
      submission: {
        ...submission,
        user: submission.profiles,
        reviewed_by_user: reviewer,
        // Replace URLs with signed URLs
        id_document_front_url: idDocumentFrontUrl,
        id_document_back_url: idDocumentBackUrl,
        selfie_url: selfieUrl,
        proof_of_address_url: proofOfAddressUrl,
      },
    });
  } catch (error) {
    console.error('Admin KYC submission detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
