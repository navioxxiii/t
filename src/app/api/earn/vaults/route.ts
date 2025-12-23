/**
 * GET /api/earn/vaults
 * Fetch all available investment vaults
 * Returns empty array if feature is disabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EARN_ENABLED } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!EARN_ENABLED) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    // Fetch all active vaults
    const { data: vaults, error } = await supabase
      .from('earn_vaults')
      .select('*')
      .eq('status', 'active')
      .order('apy_percent', { ascending: false });

    if (error) {
      console.error('Failed to fetch earn vaults:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vaults' },
        { status: 500 }
      );
    }

    // Calculate availability for each vault
    const vaultsWithAvailability = vaults?.map((vault) => {
      const filled = Number(vault.current_filled) || 0;
      const capacity = vault.total_capacity ? Number(vault.total_capacity) : null;

      const isFull = capacity !== null && filled >= capacity;
      const fillPercentage = capacity !== null ? (filled / capacity) * 100 : 0;

      return {
        ...vault,
        availability: {
          isFull,
          fillPercentage,
          remainingCapacity: capacity !== null ? capacity - filled : null,
        },
      };
    }) || [];

    return NextResponse.json({
      vaults: vaultsWithAvailability,
      count: vaultsWithAvailability.length,
    });

  } catch (error) {
    console.error('Earn vaults API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
