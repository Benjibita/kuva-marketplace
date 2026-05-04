-- Vendor-managed sale pricing for marketplace display

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sale_price_ugx NUMERIC(10, 2);

ALTER TABLE products
  ADD CONSTRAINT products_sale_price_check
  CHECK (
    sale_price_ugx IS NULL
    OR sale_price_ugx > 0
  );
