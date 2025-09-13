/*
          # Create Backups Storage Bucket
          This migration creates a new storage bucket named 'backups' for storing user-generated data backups. It also applies Row Level Security (RLS) policies to ensure that users can only access and manage their own backup files, enhancing data privacy and security.

          ## Query Description: 
          - Creates a public storage bucket named 'backups'.
          - Enables Row Level Security on the storage objects table.
          - Creates policies allowing authenticated users to:
            1. View only their own backup files.
            2. Upload new backup files into their own folder.
            3. Update their own backup files.
            4. Delete their own backup files.
          This ensures strict data isolation between users. No data will be lost, as this only adds new storage capabilities.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the policies and bucket)

          ## Structure Details:
          - Bucket: `storage.buckets` (new entry 'backups')
          - Policies: Applied to `storage.objects` for the 'backups' bucket.

          ## Security Implications:
          - RLS Status: Enabled for `storage.objects`.
          - Policy Changes: Yes, new policies are created to restrict access.
          - Auth Requirements: Users must be authenticated to interact with the backups bucket.

          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact. RLS checks are highly optimized.
          */

-- 1. Create the storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage objects if not already enabled
-- This is a safe operation, it will only enable it if it's disabled.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for users to view their own backups
CREATE POLICY "Allow authenticated users to view their own backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'backups' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Create policy for users to upload backups
CREATE POLICY "Allow authenticated users to upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'backups' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Create policy for users to update their own backups
CREATE POLICY "Allow authenticated users to update their own backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'backups' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Create policy for users to delete their own backups
CREATE POLICY "Allow authenticated users to delete their own backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'backups' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
