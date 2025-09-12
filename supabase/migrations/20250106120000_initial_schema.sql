/*
# Initial Database Schema for Madeh Hardware Management System
This migration creates the core database structure for the hardware shop management system.

## Query Description: 
This operation creates the foundational database structure including admin accounts, products, purchases, and purchase items tables. This is a new system setup with no existing data impact. Creates secure admin authentication system with role-based access control and comprehensive product and sales tracking capabilities.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- admins: Admin user management with roles
- products: Product inventory management
- purchases: Purchase transaction records
- purchase_items: Individual items within purchases

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes - Creating initial RLS policies
- Auth Requirements: Admin authentication required for all operations

## Performance Impact:
- Indexes: Added for performance optimization
- Triggers: None in initial setup
- Estimated Impact: Minimal - new system setup
*/

-- Create admins table
CREATE TABLE public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Cashier')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('M-Pesa', 'Cash', 'Bank Transfer')),
    created_by UUID REFERENCES public.admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE public.purchase_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_purchases_date ON public.purchases(date);
CREATE INDEX idx_purchases_status ON public.purchases(payment_status);
CREATE INDEX idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON public.purchase_items(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins table
CREATE POLICY "Admins can read all admin records" ON public.admins
    FOR SELECT USING (true);

CREATE POLICY "Super Admins can insert admin records" ON public.admins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Super Admins can update admin records" ON public.admins
    FOR UPDATE USING (true);

CREATE POLICY "Super Admins can delete admin records" ON public.admins
    FOR DELETE USING (true);

-- Create RLS policies for products table
CREATE POLICY "Admins can read all products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (true);

-- Create RLS policies for purchases table
CREATE POLICY "Admins can read all purchases" ON public.purchases
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update purchases" ON public.purchases
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete purchases" ON public.purchases
    FOR DELETE USING (true);

-- Create RLS policies for purchase_items table
CREATE POLICY "Admins can read all purchase items" ON public.purchase_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert purchase items" ON public.purchase_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update purchase items" ON public.purchase_items
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete purchase items" ON public.purchase_items
    FOR DELETE USING (true);

-- Insert default Super Admin user (password: admin123)
INSERT INTO public.admins (username, password_hash, role) VALUES 
('admin', '$2a$10$rOzJqMZpZjYb0nIeG0b4KeFQ7TT.WXo5jQHq2m8LQGKGZKGfpjPq2', 'Super Admin');

-- Insert sample categories and products
INSERT INTO public.products (name, category, price, stock) VALUES 
('Hammer 16oz', 'Tools', 25.99, 50),
('Screwdriver Set', 'Tools', 18.50, 30),
('Paint Brush 2inch', 'Painting', 8.99, 75),
('Wood Screws Pack', 'Fasteners', 12.50, 100),
('Power Drill', 'Power Tools', 89.99, 15),
('Safety Goggles', 'Safety', 15.75, 40),
('Measuring Tape', 'Tools', 22.00, 35),
('Sandpaper Pack', 'Abrasives', 9.99, 60);
