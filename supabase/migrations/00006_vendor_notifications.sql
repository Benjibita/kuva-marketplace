-- Create Vendor Notifications Table for in-app and email notifications
CREATE TYPE notification_type AS ENUM ('order_placed', 'order_confirmed', 'order_shipped', 'order_cancelled');
CREATE TYPE notification_status AS ENUM ('unread', 'read');

CREATE TABLE vendor_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'unread',
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on vendor_notifications
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;

-- Vendor Notifications RLS Policies
-- Vendors can view their own notifications
CREATE POLICY "Vendors can view own notifications" ON vendor_notifications FOR SELECT USING (auth.uid() = vendor_id);
-- Only system/service can insert (via triggers or server-side logic)
CREATE POLICY "Only admins can insert notifications" ON vendor_notifications FOR INSERT WITH CHECK (false);
CREATE POLICY "Vendors can update own notifications" ON vendor_notifications FOR UPDATE USING (auth.uid() = vendor_id);

-- Create index for faster lookups
CREATE INDEX idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX idx_vendor_notifications_order_id ON vendor_notifications(order_id);
CREATE INDEX idx_vendor_notifications_status ON vendor_notifications(status);

-- Create order_items table to link orders with products (for checkout)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(10, 2) NOT NULL,
  sale_price_per_unit NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order Items RLS Policies
CREATE POLICY "Users can view order items from their orders" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
