/*
  # [Function Update] secure_create_purchase
  This migration updates the `create_purchase` function to enhance security by explicitly setting the `search_path`. This mitigates potential risks associated with mutable search paths, as flagged by the security advisory.

  ## Query Description: This operation replaces the existing `create_purchase` function with a more secure version. It does not alter the function's logic but adds a security parameter (`SET search_path = public`). This change has no impact on existing data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (The previous function definition can be restored)

  ## Structure Details:
  - Function affected: `public.create_purchase`

  ## Security Implications:
  - RLS Status: The function operates under the caller's permissions (SECURITY INVOKER).
  - Policy Changes: No
  - Auth Requirements: Requires an authenticated user with permissions to read/write `products`, `purchases`, and `purchase_items`.
  - **Security Enhancement**: Sets a fixed `search_path` to prevent hijacking.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/
CREATE OR REPLACE FUNCTION public.create_purchase(
  p_admin_id uuid,
  p_payment_method text,
  p_payment_status text,
  p_items jsonb
)
RETURNS uuid -- Returns the new purchase ID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_purchase_id uuid;
  total_amount numeric := 0;
  item record;
  calculated_price numeric;
  current_stock integer;
BEGIN
  -- Step 1: Calculate total amount based on current product prices
  -- This loop is for calculation only, not for modification yet.
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer)
  LOOP
    SELECT price INTO calculated_price FROM products WHERE id = item.product_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found. Purchase cannot be completed.', item.product_id;
    END IF;
    total_amount := total_amount + (calculated_price * item.quantity);
  END LOOP;

  -- Step 2: Insert the main purchase record
  INSERT INTO purchases (created_by, total_amount, payment_method, payment_status)
  VALUES (p_admin_id, total_amount, p_payment_method, p_payment_status)
  RETURNING id INTO new_purchase_id;

  -- Step 3: Insert purchase items and update product stock
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer)
  LOOP
    -- Lock the product row, get its current price and stock
    SELECT price, stock INTO calculated_price, current_stock FROM products WHERE id = item.product_id FOR UPDATE;

    -- Verify stock again in case it changed
    IF current_stock < item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product ID %. Available: %, Required: %.', item.product_id, current_stock, item.quantity;
    END IF;

    -- Insert the item linked to the new purchase
    INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
    VALUES (new_purchase_id, item.product_id, item.quantity, calculated_price);

    -- Decrement the stock
    UPDATE products
    SET stock = stock - item.quantity
    WHERE id = item.product_id;
  END LOOP;

  -- Step 4: Return the ID of the newly created purchase
  RETURN new_purchase_id;
END;
$$;
