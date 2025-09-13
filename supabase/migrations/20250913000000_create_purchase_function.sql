/*
# [Function: create_purchase]
Creates a new purchase, its associated items, and updates product stock within a single transaction to ensure data integrity.

## Query Description: This function, `create_purchase`, is designed to handle the entire process of recording a new sale. It takes payment details and a list of items being purchased. It will create a new entry in the `purchases` table, add each item to the `purchase_items` table, and decrement the stock count in the `products` table. The entire operation is wrapped in a transaction. If any step fails (e.g., insufficient stock for an item), all changes will be automatically rolled back, preventing inconsistent data. This ensures that a sale is only recorded if all conditions are met.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function Name: create_purchase
- Tables affected: `purchases` (INSERT), `purchase_items` (INSERT), `products` (UPDATE)

## Security Implications:
- RLS Status: Assumes RLS is enabled on the tables. This function runs with the permissions of the role that created it (`security definer`), allowing it to safely update stock and create records even with restrictive user policies. The `created_by` field is securely populated with the ID of the user calling the function.
- Policy Changes: No
- Auth Requirements: An authenticated user must call this.

## Performance Impact:
- Indexes: Relies on primary key indexes on `products` and `purchases`.
- Triggers: No new triggers are added.
- Estimated Impact: Low. The function performs a few indexed writes and updates per call.
*/

create or replace function public.create_purchase(
    payment_method_param text,
    payment_status_param text,
    items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
    new_purchase_id uuid;
    total_amount_calc numeric := 0;
    item record;
    product_record record;
begin
    -- Calculate total amount from items JSON to prevent client-side tampering
    for item in select * from jsonb_to_recordset(items) as x(product_id uuid, quantity int)
    loop
        select price into product_record from public.products where id = item.product_id;
        if not found then
            raise exception 'Product with ID % not found', item.product_id;
        end if;
        total_amount_calc := total_amount_calc + (product_record.price * item.quantity);
    end loop;

    -- Insert into purchases table
    insert into public.purchases (total_amount, payment_method, payment_status, created_by)
    values (total_amount_calc, payment_method_param, payment_status_param, auth.uid())
    returning id into new_purchase_id;

    -- Insert into purchase_items and update stock
    for item in select * from jsonb_to_recordset(items) as x(product_id uuid, quantity int)
    loop
        -- Re-fetch product record inside the loop to lock the row and get current stock
        select price, stock into product_record from public.products where id = item.product_id for update;

        if product_record.stock < item.quantity then
            raise exception 'Insufficient stock for product ID %', item.product_id;
        end if;

        insert into public.purchase_items (purchase_id, product_id, quantity, price)
        values (new_purchase_id, item.product_id, item.quantity, product_record.price);

        update public.products
        set stock = stock - item.quantity
        where id = item.product_id;
    end loop;

    return new_purchase_id;
end;
$$;

grant execute on function public.create_purchase(text, text, jsonb) to authenticated;
