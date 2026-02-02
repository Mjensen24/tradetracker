-- Create withdrawals table for tracking individual withdrawal transactions
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawals(withdrawal_date);
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_date ON withdrawals(account_id, withdrawal_date);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own withdrawals"
ON withdrawals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
ON withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawals"
ON withdrawals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own withdrawals"
ON withdrawals FOR DELETE
USING (auth.uid() = user_id);
