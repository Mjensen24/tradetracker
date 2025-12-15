-- Add strategy column to trades table
-- Run this in Supabase SQL Editor

ALTER TABLE trades
ADD COLUMN strategy VARCHAR(50);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN trades.strategy IS 'Trading strategy used (Momentum, Dip, Scalp, Reversal, Breakout)';
