-- Soft delete for products (retain rows for history / audit)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN products.deleted_at IS 'When set, product is hidden from marketplace; row is not physically deleted.';

CREATE INDEX IF NOT EXISTS idx_products_active
  ON products (vendor_id)
  WHERE deleted_at IS NULL;

-- Buyers and anonymous users must not see soft-deleted listings.
-- Vendors can still SELECT their own rows (including deleted) for support / future restore UIs.
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "Products viewable if active or owned by vendor"
  ON products FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = vendor_id);
