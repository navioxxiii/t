/**
 * Admin Email Templates API
 * GET - List templates (paginated)
 * POST - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const globalFilter = searchParams.get('globalFilter') || '';
    const categoryFilter = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('email_templates')
      .select('*', { count: 'exact' });

    if (globalFilter) {
      query = query.or(`name.ilike.%${globalFilter}%,subject.ilike.%${globalFilter}%`);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { count: totalCount } = await query;

    query = supabase
      .from('email_templates')
      .select('*');

    if (globalFilter) {
      query = query.or(`name.ilike.%${globalFilter}%,subject.ilike.%${globalFilter}%`);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to fetch email templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      data: templates || [],
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('Email templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, subject, content, category, replyMode, ctaLabel, ctaUrl } = body;

    if (!name?.trim() || !subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Name, subject, and content are required' }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        subject,
        content,
        category: category || 'custom',
        reply_mode: replyMode || 'no_reply',
        cta_label: ctaLabel || null,
        cta_url_template: ctaUrl || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Create template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
