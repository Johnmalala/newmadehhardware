/*
  # [Operation] Add Buying Price to Products
  [This migration adds a 'buying_price' column to the 'products' table to track the cost of goods.]

  ## Query Description: [This operation adds a new 'buying_price' column to your products table. It will default to 0 for all existing products. No data will be lost, but you may want to update the buying price for your existing inventory later.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: products
  - Column Added: buying_price (NUMERIC, NOT NULL, DEFAULT 0)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None added
  - Triggers: None added
  - Estimated Impact: Negligible. A brief lock may be placed on the 'products' table during the column addition.
*/
ALTER TABLE public.products
ADD COLUMN buying_price NUMERIC NOT NULL DEFAULT 0;
