/*
# [Function Consolidation] Consolidate create_purchase function
This migration resolves a function overloading issue by removing duplicate definitions of the `create_purchase` function and recreating a single, definitive version.

## Query Description:
This operation will drop any existing `create_purchase` functions that match the conflicting signatures and then create a new one. This is a safe operation as it only affects the function definition and does not alter any table data. It ensures that future calls to this function are unambiguous.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (but the previous state was broken)

## Structure Details:
- Drops: `public.create_purchase(jsonb, uuid, text, text, numeric)`
- Drops: `public.create_purchase(uuid, numeric, text, text, jsonb)`
- Creates: `public.create_purchase(items jsonb, p_created_by uuid, p_payment_method text, p_payment_status text, p_total_amount numeric)`

## Security Implications:
- RLS Status: Not affected
- Policy Changes: No
- Auth Requirements: The recreated function will use `SECURITY DEFINER` as per best practices.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Function calls will be slightly faster as the planner will not have to resolve overloads.
*/

-- Drop the conflicting function overloads based on their signatures
DROP FUNCTION IF EXISTS public.create_purchase(jsonb, uuid, text, text, numeric);
DROP FUNCTION IF EXISTS public.create_purchase(uuid, numeric, text, text, jsonb);

-- Recreate the function with the single, correct signature and logic
CREATE OR REPLACE FUNCTION public.create_purchase(
  items jsonb,
  p_created_by uuid,
  p_payment_method text,
  p_payment_status text,
  p_total_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id uuid;
  item_record jsonb;
  v_product_id uuid;
  v_quantity int;
  v_price numeric;
  v_current_stock int;
BEGIN
  -- Insert the main purchase record
  INSERT INTO purchases (created_by, total_amount, payment_method, payment_status)
  VALUES (p_created_by, p_total_amount, p_payment_method, p_payment_status)
  RETURNING id INTO v_purchase_id;

  -- Loop through the items in the cart
  FOR item_record IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    v_product_id := (item_record->>'product_id')::uuid;
    v_quantity := (item_record->>'quantity')::int;

    -- Get the current price and stock for the product, and lock the row
    SELECT price, stock INTO v_price, v_current_stock
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    -- Check for sufficient stock
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product with ID % not found', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      -- This is the improved error message part
      RAISE EXCEPTION 'Not enough stock for product ID %', v_product_id;
    END IF;

    -- Insert into purchase_items
    INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
    VALUES (v_purchase_id, v_product_id, v_quantity, v_price);

    -- Update the product stock
    UPDATE products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;
  END LOOP;
END;
$$;
