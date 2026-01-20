-- Additions for Bill Splitting Feature

CREATE TABLE IF NOT EXISTS group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
  created_by TEXT REFERENCES users(email),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_order_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_order_id UUID REFERENCES group_orders(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  share_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid
  payment_method TEXT, -- pix, credit_card, etc.
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_group_orders_order_id ON group_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_group_members_email ON group_order_members(email);
