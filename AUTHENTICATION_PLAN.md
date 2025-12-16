# Authentication Implementation Plan

## Overview
This document outlines the steps needed to implement user authentication for the Trade Tracker application using Supabase Auth.

## Requirements
- ✅ Deploy with Netlify
- ✅ Supabase handles authentication
- ❌ **NO public signup** - Only you can log in (single user)
- ⚠️ **CRITICAL: Cannot lose existing data** - All current trades/accounts must be preserved
- ✅ Existing data must be migrated to your user account

## Current State
- ✅ Supabase client is configured
- ✅ Database tables exist (trades, accounts)
- ✅ **Existing data in database** (real trades - must preserve!)
- ❌ No authentication implemented
- ❌ No user-scoped data access
- ❌ No login UI

## Implementation Steps

### 1. **Supabase Database Setup** (Backend) - CRITICAL: Data Preservation
   - [ ] **FIRST: Create your user account in Supabase Auth** (via dashboard or SQL)
   - [ ] **BACKUP: Export existing data** (trades and accounts) as SQL backup
   - [ ] Add `user_id` column to `accounts` table (nullable initially)
   - [ ] Add `user_id` column to `trades` table (nullable initially)
   - [ ] **MIGRATION: Assign all existing data to your user_id**
     ```sql
     -- After creating your auth user, get your user_id
     -- Then run:
     UPDATE accounts SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
     UPDATE trades SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
     ```
   - [ ] Make `user_id` NOT NULL after migration
   - [ ] Set up Row Level Security (RLS) policies:
     - Accounts: Users can only see/modify their own accounts
     - Trades: Users can only see/modify their own trades
   - [ ] **Disable public signup** in Supabase dashboard (Authentication > Settings)

### 2. **Authentication Hook** (Frontend)
   - [ ] Create `src/hooks/useAuth.js` hook:
     - Session state management
     - **Sign in function only** (email/password) - NO signup
     - Sign out function
     - Password reset function (if needed)
     - Session persistence handling
     - Loading and error states
     - Auto-check session on mount

### 3. **Login Component** (Frontend) - NO SIGNUP
   - [ ] Create `src/components/Auth/Login.jsx`:
     - Email/password form
     - "Forgot password?" link (optional)
     - **NO signup link** - signup disabled
     - Error message display
     - Loading states
     - Consistent styling with app theme (dark mode)

### 4. **Update Data Hooks** (Frontend)
   - [ ] Update `src/hooks/useTrades.js`:
     - Filter queries by `user_id` from session
     - Ensure all operations are user-scoped
   - [ ] Update `src/hooks/useAccount.js`:
     - Filter queries by `user_id` from session
     - Ensure all operations are user-scoped
     - Handle first-time user account creation

### 5. **App Component Updates** (Frontend)
   - [ ] Update `src/App.jsx`:
     - Add auth state check
     - Show login screen if not authenticated
     - Show main app if authenticated
     - Handle session refresh
     - Add logout functionality (maybe in Settings or Sidebar)

### 6. **UI/UX Enhancements**
   - [ ] Add logout button to Settings or Sidebar
   - [ ] Show user email/name in header or sidebar
   - [ ] Handle "session expired" gracefully
   - [ ] Add loading states during auth checks

### 7. **Environment & Security**
   - [ ] Verify `.env` file has correct Supabase URL and keys
   - [ ] Ensure `.env` is in `.gitignore`
   - [ ] Set up environment variables for production deployment
   - [ ] Configure Supabase redirect URLs for production

### 8. **Testing & Migration** - CRITICAL
   - [ ] **Verify existing data is intact** after migration
   - [ ] Test login flow
   - [ ] Test logout flow
   - [ ] Test password reset flow (if enabled)
   - [ ] Test session persistence (refresh page)
   - [ ] **Verify all trades/accounts are accessible** after login
   - [ ] Test that data queries work correctly with user_id filter

## Database Schema Changes - SAFE MIGRATION PROCESS

### Step 1: Add Columns (Nullable First)
```sql
-- Add nullable columns first (safe - won't break existing data)
ALTER TABLE accounts 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE trades 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

### Step 2: Create Your Auth User
- Go to Supabase Dashboard > Authentication > Users
- Create a new user with your email/password
- **Copy the user ID** (UUID) - you'll need this

### Step 3: Migrate Existing Data
```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user UUID
UPDATE accounts SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE trades SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;

-- Verify the migration
SELECT COUNT(*) FROM accounts WHERE user_id IS NULL; -- Should be 0
SELECT COUNT(*) FROM trades WHERE user_id IS NULL;   -- Should be 0
SELECT COUNT(*) FROM accounts; -- Should match your original count
SELECT COUNT(*) FROM trades;   -- Should match your original count
```

### Step 4: Make Columns Required (After Migration)
```sql
-- Only do this AFTER verifying all data is migrated
ALTER TABLE accounts 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE trades 
ALTER COLUMN user_id SET NOT NULL;
```

## RLS Policies

### Accounts Table Policies
```sql
-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts"
ON accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts"
ON accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts"
ON accounts FOR DELETE
USING (auth.uid() = user_id);
```

### Trades Table Policies
```sql
-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trades
CREATE POLICY "Users can view own trades"
ON trades FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own trades
CREATE POLICY "Users can insert own trades"
ON trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own trades
CREATE POLICY "Users can update own trades"
ON trades FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own trades
CREATE POLICY "Users can delete own trades"
ON trades FOR DELETE
USING (auth.uid() = user_id);
```

## File Structure After Implementation

```
src/
├── components/
│   ├── Auth/
│   │   └── Login.jsx (NO Signup component)
│   └── ... (existing components)
├── hooks/
│   ├── useAuth.js (NEW - login only, no signup)
│   └── useTrades.js (UPDATED - filter by user_id)
└── ... (existing files)
```

## Considerations

1. **Data Migration Safety**: 
   - Always backup before migration
   - Test migration on a copy first if possible
   - Verify row counts before and after
   - Keep user_id nullable until migration is complete

2. **No Public Signup**: 
   - Disable signup in Supabase dashboard (Authentication > Settings)
   - Only show login UI, no signup option
   - You'll create your account manually via Supabase dashboard

3. **Netlify Deployment**:
   - Set environment variables in Netlify dashboard
   - Configure redirect URLs in Supabase for your Netlify domain
   - Set up build command: `npm run build`
   - Set publish directory: `dist`

4. **Email Verification**: Optional - you can enable/disable in Supabase dashboard

5. **Password Reset**: Enable if you want to reset password via email

6. **Session Duration**: Configure in Supabase dashboard (default is usually fine)

## Migration Safety Checklist

Before running any SQL:
- [ ] **Export/backup your database** (Supabase dashboard > Database > Backups)
- [ ] Verify you can see all your trades/accounts in the current app
- [ ] Note the count of trades and accounts
- [ ] Test the migration SQL in a safe environment if possible
- [ ] Have a rollback plan (restore from backup)

After migration:
- [ ] Verify all trades are still accessible
- [ ] Verify all accounts are still accessible
- [ ] Check that row counts match
- [ ] Test the app still works with existing data

## Next Steps After Auth

1. Deploy to Netlify
2. Set up environment variables in Netlify
3. Configure Supabase redirect URLs for production
4. Test login on production
5. Verify all data is accessible
