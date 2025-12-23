/**
 * Admin Toggle Vault Status API
 * PATCH - Quick status toggle (controls visibility to investors)
 * Available to both admin and super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check admin role (both admin and super_admin allowed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: vaultId } = await params;

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validation
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!['active', 'sold_out', 'ended'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be active, sold_out, or ended' },
        { status: 400 }
      );
    }

    // Update vault status
    const { data: vault, error: updateError } = await supabase
      .from('earn_vaults')
      .update({ status })
      .eq('id', vaultId)
      .select()
      .single();

    if (updateError || !vault) {
      console.error('Failed to update vault status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vault status' },
        { status: 500 }
      );
    }

    // Generate message based on new status
    let message = '';
    switch (status) {
      case 'active':
        message = `Vault "${vault.title}" is now visible to investors and accepting investments`;
        break;
      case 'sold_out':
        message = `Vault "${vault.title}" is now hidden from investors (marked as sold out)`;
        break;
      case 'ended':
        message = `Vault "${vault.title}" is now hidden from investors (marked as ended)`;
        break;
    }

    return NextResponse.json({
      success: true,
      vault,
      message,
    });

  } catch (error) {
    console.error('Toggle vault status API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
