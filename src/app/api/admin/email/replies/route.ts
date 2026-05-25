/**
 * Admin Email Replies API
 * GET — list captured replies (paginated, optionally filtered to one send).
 * Generates short-lived signed URLs for any attachments so the admin UI
 * can download them directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STORAGE_BUCKET = 'email-reply-attachments';
const ATTACHMENT_URL_TTL_SECONDS = 300;

interface StoredAttachment {
  filename: string;
  contentType: string;
  size: number;
  storagePath: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('historyId') || '';
    const isReadFilter = searchParams.get('isRead') || '';
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const adminClient = createAdminClient();

    let countQuery = adminClient
      .from('email_replies')
      .select('*', { count: 'exact', head: true });

    if (historyId) countQuery = countQuery.eq('email_history_id', historyId);
    if (isReadFilter === 'true') countQuery = countQuery.eq('is_read', true);
    if (isReadFilter === 'false') countQuery = countQuery.eq('is_read', false);

    const { count: totalCount } = await countQuery;

    let query = adminClient
      .from('email_replies')
      .select(
        'id, email_history_id, user_id, from_email, from_name, to_email, subject, body_text, body_html, body_clean, attachments, is_read, received_at, created_at, user:profiles!email_replies_user_id_fkey(email, full_name)'
      );

    if (historyId) query = query.eq('email_history_id', historyId);
    if (isReadFilter === 'true') query = query.eq('is_read', true);
    if (isReadFilter === 'false') query = query.eq('is_read', false);

    query = query
      .order('received_at', { ascending: false })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    const { data: replies, error } = await query;

    if (error) {
      console.error('Failed to fetch email replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Replace stored attachment metadata with download-ready signed URLs.
    // Failures are non-fatal — the chip just won't be clickable.
    const dataWithUrls = await Promise.all(
      (replies || []).map(async (reply) => {
        const stored = (reply.attachments || []) as StoredAttachment[];
        const withUrls = await Promise.all(
          stored.map(async (att) => {
            const { data: signed } = await adminClient.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(att.storagePath, ATTACHMENT_URL_TTL_SECONDS);
            return {
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
              signedUrl: signed?.signedUrl ?? null,
            };
          })
        );
        return { ...reply, attachments: withUrls };
      })
    );

    return NextResponse.json({
      data: dataWithUrls,
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('Email replies API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
