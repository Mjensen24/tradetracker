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
      // Sort by trade_date (most recent first), then by id (newer trades first) for same-day trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountData.id)
        .order('trade_date', { ascending: false })
        .order('id', { ascending: false });

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

  const updateTrade = async (tradeId, updatedData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('trades')
        .update(updatedData)
        .eq('id', tradeId)
        .select();

      if (updateError) throw updateError;

      // Refresh trades after update
      await fetchTrades();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating trade:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteTrade = async (tradeId) => {
    try {
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (deleteError) throw deleteError;

      // Refresh trades after delete
      await fetchTrades();
      return { success: true };
    } catch (err) {
      console.error('Error deleting trade:', err);
      return { success: false, error: err.message };
    }
  };

  return { 
    trades, 
    loading, 
    error, 
    refetch: fetchTrades,
    updateTrade,
    deleteTrade
  };
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

  const updateAccount = async (updatedData) => {
    try {
      if (!account?.id) {
        throw new Error('No account found to update');
      }

      const { data, error: updateError } = await supabase
        .from('accounts')
        .update(updatedData)
        .eq('id', account.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setAccount(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating account:', err);
      return { success: false, error: err.message };
    }
  };

  return { account, loading, error, refetch: fetchAccount, updateAccount };
};