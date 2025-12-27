-- Create day_notes table for storing trading session notes per calendar day
CREATE TABLE IF NOT EXISTS day_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, note_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_day_notes_account_date ON day_notes(account_id, note_date);
CREATE INDEX IF NOT EXISTS idx_day_notes_user_id ON day_notes(user_id);

-- Enable RLS
ALTER TABLE day_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own day notes"
ON day_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own day notes"
ON day_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own day notes"
ON day_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own day notes"
ON day_notes FOR DELETE
USING (auth.uid() = user_id);

