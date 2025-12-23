/**
 * Admin Single Earn Vault API
 * GET - Get vault with detailed stats
 * PATCH - Update vault (super_admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: vaultId } = await params;

    // Fetch vault
    const { data: vault, error: vaultError } = await supabase
      .from('earn_vaults')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // Fetch position statistics
    const { data: positions } = await supabase
      .from('user_earn_positions')
      .select('status, amount_usdt, total_profit_usdt')
      .eq('vault_id', vaultId);

    const activePositions = positions?.filter((p) => p.status === 'active') || [];
    const maturedPositions = positions?.filter((p) => p.status === 'matured') || [];
    const withdrawnPositions = positions?.filter((p) => p.status === 'withdrawn') || [];

    const totalLocked = activePositions.reduce((sum, p) => sum + Number(p.amount_usdt), 0);
    const averagePositionSize = activePositions.length > 0
      ? totalLocked / activePositions.length
      : 0;

    const capacityUsedPercent = vault.total_capacity
      ? (Number(vault.current_filled) / Number(vault.total_capacity)) * 100
      : 0;

    const stats = {
      total_positions: positions?.length || 0,
      active_positions: activePositions.length,
      matured_positions: maturedPositions.length,
      withdrawn_positions: withdrawnPositions.length,
      total_locked_usdt: totalLocked,
      total_capacity_used_percent: capacityUsedPercent,
      average_position_size: averagePositionSize,
    };

    return NextResponse.json({
      vault,
      stats,
    });

  } catch (error) {
    console.error('Get vault API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

    // Check super_admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can edit vaults' },
        { status: 403 }
      );
    }

    const { id: vaultId } = await params;

    // Check if vault has active positions
    const { data: activePositions } = await supabase
      .from('user_earn_positions')
      .select('id')
      .eq('vault_id', vaultId)
      .eq('status', 'active');

    const hasActivePositions = (activePositions?.length || 0) > 0;

    // Parse request body
    const body = await request.json();

    // If vault has active positions, prevent editing critical fields
    if (hasActivePositions) {
      if (body.apy_percent !== undefined || body.duration_months !== undefined) {
        return NextResponse.json(
          {
            error: 'Cannot modify APY or duration for vaults with active positions',
            activePositionsCount: activePositions?.length,
          },
          { status: 400 }
        );
      }
    }

    // Validation for allowed updates
    if (body.apy_percent !== undefined && (body.apy_percent <= 0 || body.apy_percent > 100)) {
      return NextResponse.json(
        { error: 'APY must be between 0.1 and 100' },
        { status: 400 }
      );
    }

    if (body.duration_months !== undefined && ![1, 3, 6, 12].includes(body.duration_months)) {
      return NextResponse.json(
        { error: 'Duration must be 1, 3, 6, or 12 months' },
        { status: 400 }
      );
    }

    if (body.min_amount !== undefined && body.min_amount <= 0) {
      return NextResponse.json(
        { error: 'Minimum amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.max_amount !== undefined && body.min_amount !== undefined) {
      if (body.max_amount <= body.min_amount) {
        return NextResponse.json(
          { error: 'Maximum amount must be greater than minimum amount' },
          { status: 400 }
        );
      }
    }

    if (body.risk_level !== undefined && !['low', 'medium', 'high'].includes(body.risk_level)) {
      return NextResponse.json(
        { error: 'Risk level must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Update vault
    const { data: vault, error: updateError } = await supabase
      .from('earn_vaults')
      .update(body)
      .eq('id', vaultId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update vault:', updateError);

      // Handle unique constraint violation
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A vault with this title already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update vault' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vault,
      message: 'Vault updated successfully',
    });

  } catch (error) {
    console.error('Update vault API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
