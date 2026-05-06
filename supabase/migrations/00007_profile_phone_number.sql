-- Ensure phone number exists on profiles for all environments
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

COMMENT ON COLUMN profiles.phone_number IS 'User telephone number in international format (e.g. +256...)';
