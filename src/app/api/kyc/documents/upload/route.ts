import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    // Extract extension safely, defaulting to jpg for images
    const nameParts = file.name.split('.');
    let extension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : null;

    // If no extension or invalid, derive from MIME type
    if (!extension || extension === file.name.toLowerCase()) {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        extension = 'jpg';
      } else if (file.type === 'image/png') {
        extension = 'png';
      } else if (file.type === 'image/webp') {
        extension = 'webp';
      } else if (file.type === 'application/pdf') {
        extension = 'pdf';
      } else {
        extension = 'jpg'; // Fallback
      }
    }

    const filename = `${user.id}/${type}_${timestamp}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', {
        message: uploadError.message,
        name: uploadError.name,
        filename,
        fileType: file.type,
        fileSize: file.size,
        userId: user.id,
      });
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(filename);

    // Note: For private buckets, we'd use createSignedUrl instead
    // For now, we'll store the path and use RLS to control access
    const storagePath = filename;

    return NextResponse.json({
      success: true,
      url: storagePath,
      publicUrl,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
