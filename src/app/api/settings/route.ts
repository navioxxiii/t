/**
 * Settings API Endpoint
 * GET /api/settings - Fetch all settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/actions/settings';

export async function GET(request: NextRequest) {
  try {
    const result = await getSettings();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({
      settings: result.settings,
    }, {
      headers: {
        // Don't cache - always fetch fresh on settings page
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
