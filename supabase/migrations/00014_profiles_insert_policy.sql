-- Allow newly signed-up users to create their profile row (signup upsert / recovery).
-- Without this, INSERT is denied by RLS and products.vendor_id FK fails.

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
