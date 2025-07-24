/*
  # Initial Schema for Tapor Accounting System

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `address` (text, optional)
      - `phone` (text, optional)
      - `national_id` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `quantity` (integer)
      - `purchase_price` (decimal, optional)
      - `sale_price` (decimal)
      - `description` (text, optional)
      - `created_at` (timestamp)
    
    - `invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (integer, unique)
      - `customer_id` (uuid, foreign key)
      - `type` (text) -- 'invoice' or 'pre-invoice'
      - `subtotal` (decimal)
      - `discount_type` (text) -- 'percent' or 'amount'
      - `discount_value` (decimal)
      - `discount_amount` (decimal)
      - `total` (decimal)
      - `status` (text) -- 'draft', 'final'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price` (decimal)
      - `total` (decimal)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  national_id VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  purchase_price DECIMAL(15,2),
  sale_price DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('invoice', 'pre-invoice')),
  subtotal DECIMAL(15,2) NOT NULL,
  discount_type VARCHAR(10) DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
  discount_value DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a single-user system)
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations on invoice_items" ON invoice_items FOR ALL USING (true);

-- Create function to update product quantity
CREATE OR REPLACE FUNCTION update_product_quantity(product_id INTEGER, quantity_change INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity + quantity_change 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top products
CREATE OR REPLACE FUNCTION get_top_products(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(200),
  quantity INTEGER,
  purchase_price DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMPTZ,
  soldQuantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.quantity,
    p.purchase_price,
    p.sale_price,
    p.description,
    p.created_at,
    COALESCE(SUM(ii.quantity), 0) as soldQuantity
  FROM products p
  LEFT JOIN invoice_items ii ON p.id = ii.product_id
  LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.type = 'invoice'
  GROUP BY p.id, p.name, p.quantity, p.purchase_price, p.sale_price, p.description, p.created_at
  ORDER BY soldQuantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);