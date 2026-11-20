import { supabase } from '@/lib/supabase';
import { Holding } from '@/types/holdings';

export const DEMO_HOLDINGS: Holding[] = [
  { id: 'demo-1', name: 'Physical Gold 24K', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 25, buy_price: 13800, currentPrice: 14394, sector: 'Precious Metals / Bullion', created_at: '2025-11-15T00:00:00Z' },
  { id: 'demo-2', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', qty: 40, buy_price: 2680, currentPrice: 2950, sector: 'Energy & Petrochemicals', created_at: '2026-01-10T00:00:00Z' },
  { id: 'demo-3', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', qty: 650, buy_price: 142.50, currentPrice: 168.40, sector: 'Small Cap Equity', created_at: '2025-08-20T00:00:00Z' },
  { id: 'demo-4', name: 'Bitcoin Secure Custody', symbol: 'BTC-INR', type: 'Crypto', qty: 0.12, buy_price: 4850000, currentPrice: 5420000, sector: 'Digital Assets', created_at: '2026-03-01T00:00:00Z' },
  { id: 'demo-5', name: 'HDFC Corporate Bond FD', symbol: 'FDRD_118000', type: 'Debt', qty: 1, buy_price: 105000, currentPrice: 118000, sector: 'Fixed Income', created_at: '2025-06-01T00:00:00Z' },
  { id: 'demo-6', name: 'Physical Silver Bullion (999)', symbol: 'SILVER_INR_1G', type: 'Commodity', qty: 450, buy_price: 215.00, currentPrice: 225.00, sector: 'Precious Metals / Bullion', created_at: '2026-02-12T00:00:00Z' }
];

export async function fetchUserHoldings(): Promise<Holding[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return DEMO_HOLDINGS;
    }

    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_HOLDINGS;
    }

    return data as Holding[];
  } catch (err) {
    console.error('Fetch holdings error:', err);
    return DEMO_HOLDINGS;
  }
}
