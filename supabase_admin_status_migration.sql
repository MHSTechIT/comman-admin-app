-- Run this in your Supabase SQL Editor if the admin_status column doesn't exist yet.
-- This adds a text column to user_profiles for storing status: 'fresh' | 'pending' | 'completed'.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS admin_status text DEFAULT 'fresh';

-- Optional: add a check constraint to restrict values
-- ALTER TABLE user_profiles
-- ADD CONSTRAINT user_profiles_admin_status_check
-- CHECK (admin_status IN ('fresh', 'pending', 'completed'));
