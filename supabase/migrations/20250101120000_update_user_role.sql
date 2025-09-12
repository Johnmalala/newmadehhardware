/*
# [Operation Name]
Update User Role

## Query Description: [This operation changes the role for the user 'admin@madeh.com' to 'Admin'. This will grant them administrative privileges according to the application's logic. Ensure this user is intended to have these permissions. There is no data loss risk.]

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
[
  "Table: admins",
  "Column: role"
]

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: [This grants application-level admin privileges.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. Updates a single row.]
*/

-- Update the role for the specified user
UPDATE public.admins
SET role = 'Admin'
WHERE username = 'admin@madeh.com';
