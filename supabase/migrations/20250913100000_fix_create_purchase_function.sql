/*
  # Fix `create_purchase` Function Logic
  [This migration updates the `create_purchase` function to correctly handle stock-checking logic and provide clearer error messages.]

  ## Query Description: [This operation modifies the `create_purchase` function. The previous version could incorrectly report a NULL product ID in its error message if a stock check failed. This version refactors the loop to ensure the product ID is always available when raising an exception, making error diagnosis straightforward. It also adds an explicit check to ensure product IDs are not null before processing.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: `public.create_purchase`
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [No change]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
create or replace function public.create_purchase(
  items jsonb,
  p_created_by uuid,
  p_payment_method text,
  p_payment_status text,
  p_total_amount numeric
)
returns void as $$
declare
  new_purchase_id uuid;
  item_data record;
  product_info record;
begin
  -- Insert the new purchase record
  insert into public.purchases (created_by, payment_method, payment_status, total_amount)
  values (p_created_by, p_payment_method, p_payment_status, p_total_amount)
  returning id into new_purchase_id;

  -- Loop through the items in the JSONB array
  for item_data in select * from jsonb_to_recordset(items) as x(product_id uuid, quantity int) loop
    
    -- Explicitly check for a NULL product_id to prevent errors
    if item_data.product_id is null then
      raise exception 'Purchase item contains a NULL product ID.';
    end if;

    -- Lock the product row and get its info to prevent race conditions
    select id, stock, price into product_info from public.products where id = item_data.product_id for update;

    -- Check for sufficient stock
    if product_info is null or product_info.stock < item_data.quantity then
      -- Now, product_info.id will be available for the error message
      raise exception 'Not enough stock for product ID %', item_data.product_id;
    end if;

    -- Insert into purchase_items
    insert into public.purchase_items (purchase_id, product_id, quantity, price)
    values (
      new_purchase_id,
      product_info.id,
      item_data.quantity,
      product_info.price
    );

    -- Update product stock
    update public.products
    set stock = stock - item_data.quantity
    where id = product_info.id;
  end loop;
end;
$$ language plpgsql
security definer
set search_path = public;
