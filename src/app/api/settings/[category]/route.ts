/**
 * Category Settings API Endpoint
 * POST /api/settings/[category] - Save settings for a specific category
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveCategorySettings } from '@/lib/actions/settings';
import { SettingCategory } from '@/types/settings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categoryParam } = await params;
    const category = categoryParam as SettingCategory;

    // Validate category
    if (!['system', 'wallet', 'security'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.settings || !Array.isArray(body.settings)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const result = await saveCategorySettings({
      category,
      settings: body.settings,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
