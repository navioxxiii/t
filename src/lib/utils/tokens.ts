/**
 * Token Icon Utility Functions
 * Centralized logic for token logo/icon loading
 */

/**
 * Get token icon path from static assets or fallback to default
 *
 * @param symbol Token symbol (e.g., 'btc', 'eth', 'usdt')
 * @returns Image path for token icon
 *
 * @example
 * ```typescript
 * const icon = getTokenIcon('btc'); // Returns '/tokens/btc.png'
 * const fallback = getTokenIcon('default'); // Returns '/tokens/default.png'
 * ```
 */
export function getTokenIcon(symbol: string): string {
  // Default fallback for unknown tokens
  if (!symbol || symbol === 'default') {
    return '/tokens/default.png';
  }

  const lowerSymbol = symbol.toLowerCase();

  // Return path to token icon
  // Icons should be placed in /public/tokens/ directory
  return `/tokens/${lowerSymbol}.png`;
}

/**
 * Get token logo URL from database (future enhancement)
 *
 * Currently returns the same as getTokenIcon(), but can be enhanced
 * to fetch from base_tokens.logo_url in the database.
 *
 * @param tokenCode Token code from base_tokens table
 * @returns Promise<string> Logo URL or fallback
 *
 * @example
 * ```typescript
 * const logo = await getTokenLogoFromDB('btc');
 * ```
 */
export async function getTokenLogoFromDB(tokenCode: string): Promise<string> {
  // TODO: Implement Supabase query to fetch from base_tokens.logo_url
  // const supabase = await createClient();
  // const { data } = await supabase
  //   .from('base_tokens')
  //   .select('logo_url')
  //   .eq('code', tokenCode.toLowerCase())
  //   .single();
  //
  // return data?.logo_url || getTokenIcon('default');

  // For now, use static file approach
  return getTokenIcon(tokenCode);
}
