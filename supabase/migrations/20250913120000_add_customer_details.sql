/*
# [Feature] Add Customer Details for Unpaid Purchases
Adds columns to the `purchases` table to store customer name and ID number for tracking debts. Updates the `create_purchase` function to handle this new information.

## Query Description: This operation will add two new columns (`customer_name` and `customer_id_number`) to the `purchases` table. It also modifies the existing `create_purchase` function to accept these new details. This change is non-destructive and will not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table `purchases`:
  - ADD COLUMN `customer_name` text
  - ADD COLUMN `customer_id_number` text
- Function `create_purchase`:
  - ADD PARAMETER `p_customer_name` text
  - ADD PARAMETER `p_customer_id_number` text

## Security Implications:
- RLS Status: Enabled on `purchases` table. The new columns will be covered by existing policies.
- Policy Changes: No
- Auth Requirements: `authenticated` role can call the function.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible.
*/

-- Add columns to purchases table
ALTER TABLE public.purchases
ADD COLUMN customer_name text,
ADD COLUMN customer_id_number text;

-- Recreate the create_purchase function to include customer details and server-side total calculation
DROP FUNCTION IF EXISTS public.create_purchase(jsonb,uuid,text,text,numeric);
DROP FUNCTION IF EXISTS public.create_purchase(jsonb,uuid,text,text);


CREATE OR REPLACE FUNCTION public.create_purchase(
    items jsonb,
    p_created_by uuid,
    p_payment_method text,
    p_payment_status text,
    p_customer_name text DEFAULT NULL,
    p_customer_id_number text DEFAULT NULL
)
RETURNS uuid
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
    calculated_total numeric := 0;
    current_stock int;
BEGIN
    -- Loop through items to calculate total and check stock
    FOR item_record IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (item_record->>'product_id')::uuid;
        v_quantity := (item_record->>'quantity')::int;
        v_price := (item_record->>'price')::numeric;

        -- Check stock
        SELECT stock INTO current_stock FROM products WHERE id = v_product_id;
        IF current_stock IS NULL OR current_stock < v_quantity THEN
            RAISE EXCEPTION 'Not enough stock for product ID %', v_product_id;
        END IF;
        
        calculated_total := calculated_total + (v_price * v_quantity);
    END LOOP;

    -- Insert the purchase record with the server-calculated total
    INSERT INTO purchases (created_by, total_amount, payment_method, payment_status, customer_name, customer_id_number)
    VALUES (p_created_by, calculated_total, p_payment_method, p_payment_status, p_customer_name, p_customer_id_number)
    RETURNING id INTO v_purchase_id;

    -- Loop through items again to update stock and insert purchase items
    FOR item_record IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (item_record->>'product_id')::uuid;
        v_quantity := (item_record->>'quantity')::int;
        v_price := (item_record->>'price')::numeric;

        -- Update product stock
        UPDATE products
        SET stock = stock - v_quantity
        WHERE id = v_product_id;

        -- Insert into purchase_items
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
        VALUES (v_purchase_id, v_product_id, v_quantity, v_price);
    END LOOP;

    RETURN v_purchase_id;
END;
$$;
