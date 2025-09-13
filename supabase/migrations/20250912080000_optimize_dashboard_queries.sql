/*
# [Function] `get_total_sales`
Creates a PostgreSQL function to efficiently calculate the total sales from paid purchases.

## Query Description:
This operation creates a new function `get_total_sales()` that sums the `total_amount` from the `purchases` table where the `payment_status` is 'Paid'. This is a read-only operation and does not modify any existing data. It is designed to improve dashboard loading performance by calculating the total sales on the database server instead of fetching all purchase records to the client.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The function can be dropped using `DROP FUNCTION get_total_sales();`)

## Structure Details:
- Function Name: `get_total_sales`
- Return Type: `double precision`
- Tables Accessed: `purchases` (read-only)

## Security Implications:
- RLS Status: The function uses `SECURITY DEFINER` to ensure it can perform the calculation efficiently. It is secure as it only performs a SUM operation on a specific column.
- Policy Changes: No
- Auth Requirements: The function is callable by any authenticated role.
- Search Path: The search path is explicitly set to `public` to prevent search path hijacking, addressing a common security warning.

## Performance Impact:
- Indexes: This function will benefit from an index on `purchases(payment_status)`.
- Triggers: None
- Estimated Impact: Positive. Significantly reduces data transfer for the dashboard's total sales metric, leading to faster load times.
*/
CREATE OR REPLACE FUNCTION get_total_sales()
RETURNS double precision
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM purchases
  WHERE payment_status = 'Paid';
$$;
