import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      
      // Get the default account first
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id, starting_balance')
        .eq('is_default', true)
        .single();

      if (accountError) throw accountError;

      // Get all trades for this account
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountData.id)
        .order('trade_date', { ascending: false });

      if (tradesError) throw tradesError;

      // Add calculated fields to each trade
      const tradesWithCalculations = tradesData.map(trade => ({
        ...trade,
        profit_loss: (trade.exit_price - trade.entry_price) * trade.shares,
        cents_diff: trade.exit_price - trade.entry_price,
        win_loss: ((trade.exit_price - trade.entry_price) * trade.shares) > 0 ? 'W' : 'L'
      }));

      setTrades(tradesWithCalculations);
      setError(null);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { trades, loading, error, refetch: fetchTrades };
};

export const useAccount = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      
      const { data, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_default', true)
        .single();

      if (accountError) throw accountError;

      setAccount(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching account:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { account, loading, error, refetch: fetchAccount };
};