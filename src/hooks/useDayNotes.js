import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export const useDayNotes = () => {
  const [currentNote, setCurrentNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Refetch note when account changes (listen for account changes via custom event)
  useEffect(() => {
    const handleAccountChange = () => {
      // Clear current note when account changes
      setCurrentNote(null);
    };
    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
  }, []);

  const fetchDayNote = async (date) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setCurrentNote(null);
        return null;
      }

      // Get the default account first
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('is_default', true)
        .single();

      if (accountError) {
        // If no account found, return null (no error, just no note)
        setCurrentNote(null);
        return null;
      }

      // Format date as YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');

      // Get note for this date and account
      const { data: noteData, error: noteError } = await supabase
        .from('day_notes')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('note_date', dateStr)
        .single();

      if (noteError) {
        // If note doesn't exist, that's fine - return null
        if (noteError.code === 'PGRST116') {
          setCurrentNote(null);
          return null;
        }
        throw noteError;
      }

      setCurrentNote(noteData);
      return noteData;
    } catch (err) {
      console.error('Error fetching day note:', err);
      setError(err.message);
      setCurrentNote(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveDayNote = async (date, notes) => {
    try {
      setSaving(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated. Please log in to save notes.');
      }

      // Get the default account first
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('is_default', true)
        .single();

      if (accountError) throw accountError;

      // Format date as YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check if note already exists
      const { data: existingNote } = await supabase
        .from('day_notes')
        .select('id')
        .eq('account_id', accountData.id)
        .eq('note_date', dateStr)
        .single();

      const noteData = {
        account_id: accountData.id,
        user_id: session.user.id,
        note_date: dateStr,
        notes: notes || null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingNote) {
        // Update existing note
        if (!notes || notes.trim() === '') {
          // If notes are empty, delete the note
          const { error: deleteError } = await supabase
            .from('day_notes')
            .delete()
            .eq('id', existingNote.id);

          if (deleteError) throw deleteError;
          setCurrentNote(null);
          return { success: true, data: null };
        } else {
          // Update existing note
          const { data, error: updateError } = await supabase
            .from('day_notes')
            .update(noteData)
            .eq('id', existingNote.id)
            .select()
            .single();

          if (updateError) throw updateError;
          result = data;
        }
      } else {
        // Create new note (only if notes are not empty)
        if (!notes || notes.trim() === '') {
          setCurrentNote(null);
          return { success: true, data: null };
        }

        const { data, error: insertError } = await supabase
          .from('day_notes')
          .insert([noteData])
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      setCurrentNote(result);
      return { success: true, data: result };
    } catch (err) {
      console.error('Error saving day note:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const deleteDayNote = async (date) => {
    try {
      setSaving(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated. Please log in to delete notes.');
      }

      // Get the default account first
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('is_default', true)
        .single();

      if (accountError) throw accountError;

      // Format date as YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');

      // Delete note
      const { error: deleteError } = await supabase
        .from('day_notes')
        .delete()
        .eq('account_id', accountData.id)
        .eq('note_date', dateStr);

      if (deleteError) throw deleteError;

      setCurrentNote(null);
      return { success: true };
    } catch (err) {
      console.error('Error deleting day note:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  return {
    currentNote,
    loading,
    error,
    saving,
    fetchDayNote,
    saveDayNote,
    deleteDayNote
  };
};

