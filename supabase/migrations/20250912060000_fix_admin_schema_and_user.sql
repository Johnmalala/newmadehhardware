/*
# [Schema Fix] Correct Admins Table Structure
This migration removes the redundant 'password_hash' column from the 'admins' table and ensures the profile for 'admin@madeh.com' exists. This aligns the database with the Supabase authentication system.

## Query Description:
This operation modifies the 'admins' table by dropping a column. It is a structural change but is safe in this context as the 'password_hash' column is no longer used by the application. It then inserts a missing profile record. No data loss is expected.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Table: public.admins
- Action: DROP COLUMN password_hash
- Action: INSERT record for 'admin@madeh.com'

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: This change is required for Supabase Auth integration to function correctly.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The operation will be fast on a small table.
*/

-- Step 1: Remove the redundant password_hash column from the admins table.
-- This column is no longer needed as authentication is handled by Supabase Auth.
ALTER TABLE public.admins
DROP COLUMN IF EXISTS password_hash;

-- Step 2: Insert the admin profile for the user 'admin@madeh.com'.
-- This links the Supabase Auth user to their profile in the application's 'admins' table.
-- We use a subquery to get the user's ID directly from the auth.users table.
INSERT INTO public.admins (id, username, role, status)
SELECT id, 'admin@madeh.com', 'Admin', 'active'
FROM auth.users
WHERE email = 'admin@madeh.com'
-- Use ON CONFLICT to prevent an error if the record somehow already exists.
ON CONFLICT (id) DO NOTHING;
