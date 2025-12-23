/**
 * Withdrawal Error Recovery Utilities
 * Standardized rollback operations for admin withdrawal endpoints
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Rollback failed internal transfer - refund sender
 */
export async function rollbackInternalTransfer(
  supabase: SupabaseClient,
  params: {
    userId: string;
    baseTokenId: number;
    amount: number;
    requestId: string;
    originalStatus: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Refund sender balance
    const { error: refundError } = await supabase.rpc('update_user_balance', {
      p_user_id: params.userId,
      p_base_token_id: params.baseTokenId,
      p_amount: params.amount,
      p_operation: 'credit',
    });

    if (refundError) {
      console.error('Failed to refund sender during rollback:', refundError);
      return { success: false, error: 'Failed to refund sender' };
    }

    // Revert withdrawal request status
    const { error: statusError } = await supabase
      .from('withdrawal_requests')
      .update({ status: params.originalStatus })
      .eq('id', params.requestId);

    if (statusError) {
      console.error('Failed to revert status during rollback:', statusError);
      return { success: false, error: 'Failed to revert status' };
    }

    console.log('✅ Successfully rolled back internal transfer');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error during rollback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Rollback failed external withdrawal - unlock and refund
 */
export async function rollbackExternalWithdrawal(
  supabase: SupabaseClient,
  params: {
    userId: string;
    baseTokenId: number;
    amount: number;
    requestId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Unlock balance without deducting (refund)
    const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
      p_user_id: params.userId,
      p_base_token_id: params.baseTokenId,
      p_amount: params.amount,
      p_deduct: false, // Just unlock, don't deduct
    });

    if (unlockError) {
      console.error('Failed to unlock balance during rollback:', unlockError);
      return { success: false, error: 'Failed to unlock balance' };
    }

    // Mark withdrawal as failed
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'failed' })
      .eq('id', params.requestId);

    console.log('✅ Successfully rolled back external withdrawal');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error during rollback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
