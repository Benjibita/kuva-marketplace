/** Fields loaded for catalogue grids / ProductCard. */

export const CATALOG_PRODUCT_SELECT = `
  id,
  title,
  price_ugx,
  is_on_sale,
  sale_price_ugx,
  use_size_specific_prices,
  size_inventory,
  size_prices,
  images,
  category,
  stock,
  vendor:profiles!vendor_id (
    business_name
  )
`;
