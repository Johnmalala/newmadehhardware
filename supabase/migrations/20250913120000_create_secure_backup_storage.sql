/*
  # [SECURITY] Create Secure Backup Storage Bucket and Policies
  [This script corrects a permissions issue from the previous migration. It sets up a secure 'backups' bucket in Supabase Storage and applies the correct Row Level Security (RLS) policies to ensure users can only access their own backup files, without attempting to change table ownership.]

  ## Query Description: [This operation configures the storage system for user-specific backups. It creates a private bucket named 'backups' and then defines strict security rules. These rules link files to the user who uploaded them, preventing any user from seeing or accessing another user's backups. This operation is safe and does not affect existing data.]
  
  ## Metadata:
  - Schema-Category: ["Structural", "Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables Affected: storage.buckets, storage.objects
  - Policies Created:
    - "Allow authenticated select on backups" on storage.objects
    - "Allow authenticated insert on backups" on storage.objects
  
  ## Security Implications:
  - RLS Status: Enabled on storage.objects
  - Policy Changes: Yes, adds two policies to control access to the 'backups' bucket.
  - Auth Requirements: Policies rely on `auth.uid()` to identify the logged-in user.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. RLS checks are highly optimized in PostgreSQL.
*/

-- 1. Create the 'backups' bucket if it doesn't already exist.
-- This is a non-destructive, idempotent operation.
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security on the storage.objects table.
-- This is a critical step for the policies to take effect. It's safe to run even if RLS is already enabled.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist to ensure a clean state.
-- This avoids "policy already exists" errors on subsequent runs.
DROP POLICY IF EXISTS "Allow authenticated select on backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on backups" ON storage.objects;


-- 4. Create a policy that allows authenticated users to VIEW their own files in the 'backups' bucket.
-- The policy checks that the first folder in the file path matches the user's UID.
CREATE POLICY "Allow authenticated select on backups"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 5. Create a policy that allows authenticated users to UPLOAD files into their own folder within the 'backups' bucket.
-- This ensures users cannot upload files into another user's directory.
CREATE POLICY "Allow authenticated insert on backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text );
