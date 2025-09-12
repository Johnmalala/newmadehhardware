/*
  # [Data] Add Admin Profile
  [This operation inserts a new admin profile into the public.admins table for the user 'admin@madeh.com'. This is necessary to link the Supabase authenticated user to an application-level profile with specific roles and permissions.]

  ## Query Description: [This query adds a new record to the `admins` table. It is a safe, non-destructive operation. It sets the user's role to 'Admin' and status to 'active'. Without this record, the user 'admin@madeh.com' cannot access the application's protected routes.]
  
  ## Metadata:
  - Schema-Category: ["Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: public.admins
  - Columns Affected: username, role, status
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [This enables an authenticated user to have application roles.]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
INSERT INTO public.admins (username, role, status)
VALUES ('admin@madeh.com', 'Admin', 'active')
ON CONFLICT (username) DO NOTHING;
