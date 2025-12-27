import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated before fetching
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchTrades();
      } else {
        setLoading(false);
        setTrades([]);
      }
    };
    checkAuthAndFetch();
  }, []);

  // Refetch trades when account changes (listen for account changes via custom event)
  useEffect(() => {
    const handleAccountChange = () => {
      fetchTrades();
    };
    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
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
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated before fetching
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchAccount();
        fetchAllAccounts();
      } else {
        setLoading(false);
        setAccount(null);
        setAllAccounts([]);
      }
    };
    checkAuthAndFetch();
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

  const fetchAllAccounts = async () => {
    try {
      const { data, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (accountsError) throw accountsError;

      setAllAccounts(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching all accounts:', err);
      return { success: false, error: err.message };
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
      await fetchAllAccounts(); // Refresh all accounts list
      return { success: true, data };
    } catch (err) {
      console.error('Error updating account:', err);
      return { success: false, error: err.message };
    }
  };

  const createAccount = async (name, startingBalance) => {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('User not authenticated. Please log in to create an account.');
      }

      // Check if this is the first account (should be set as default)
      const { data: existingAccounts, error: checkError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', session.user.id);
      
      if (checkError) throw checkError;
      
      const isFirstAccount = !existingAccounts || existingAccounts.length === 0;

      const { data, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: name,
          starting_balance: startingBalance,
          is_default: isFirstAccount, // Set as default if it's the first account
          user_id: session.user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // If this is the first account, update the account state
      if (isFirstAccount) {
        setAccount(data);
      }

      await fetchAllAccounts(); // Refresh all accounts list
      await fetchAccount(); // Refresh the current account
      return { success: true, data };
    } catch (err) {
      console.error('Error creating account:', err);
      return { success: false, error: err.message };
    }
  };

  const switchAccount = async (accountId) => {
    try {
      // First, unset all accounts as default
      const { error: unsetError } = await supabase
        .from('accounts')
        .update({ is_default: false })
        .neq('id', accountId);

      if (unsetError) throw unsetError;

      // Then set the selected account as default
      const { data, error: setError } = await supabase
        .from('accounts')
        .update({ is_default: true })
        .eq('id', accountId)
        .select()
        .single();

      if (setError) throw setError;

      setAccount(data);
      await fetchAllAccounts(); // Refresh all accounts list
      
      // Dispatch event to notify other components that account has changed
      window.dispatchEvent(new CustomEvent('accountChanged'));
      
      return { success: true, data };
    } catch (err) {
      console.error('Error switching account:', err);
      return { success: false, error: err.message };
    }
  };

  const renameAccount = async (accountId, newName) => {
    try {
      const { data, error: updateError } = await supabase
        .from('accounts')
        .update({ name: newName })
        .eq('id', accountId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state if it's the current account
      if (account?.id === accountId) {
        setAccount(data);
      }
      await fetchAllAccounts(); // Refresh all accounts list
      return { success: true, data };
    } catch (err) {
      console.error('Error renaming account:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      // Prevent deleting the active account
      if (account?.id === accountId) {
        throw new Error('Cannot delete the active account. Please switch to another account first.');
      }

      // Check if this is the last account
      if (allAccounts.length <= 1) {
        throw new Error('Cannot delete the last account.');
      }

      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) throw deleteError;

      await fetchAllAccounts(); // Refresh all accounts list
      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { success: false, error: err.message };
    }
  };

  return { 
    account, 
    allAccounts,
    loading, 
    error, 
    refetch: fetchAccount, 
    refetchAll: fetchAllAccounts,
    updateAccount,
    createAccount,
    switchAccount,
    renameAccount,
    deleteAccount
  };
};