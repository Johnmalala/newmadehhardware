/*
          # [Operation Name]
          Create Secure Backup Storage Bucket and Policies

          ## Query Description: [This script sets up a secure storage location for user backups. It creates a private 'backups' bucket and applies Row Level Security (RLS) policies. These policies ensure that each user can only access, upload, and delete their own backup files, preventing them from seeing or modifying anyone else's data. This version corrects a previous permission error by using RLS policies instead of attempting to alter table ownership, which is the standard and secure method.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Creates storage bucket: 'backups'
          - Creates 4 RLS policies on 'storage.objects' for SELECT, INSERT, UPDATE, DELETE actions.
          
          ## Security Implications:
          - RLS Status: Enabled for the 'backups' bucket.
          - Policy Changes: Yes, adds policies to restrict access to user-specific files.
          - Auth Requirements: Users must be authenticated to interact with their backups.
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. RLS checks are highly optimized.]
          */

-- Create a private bucket for backups if it doesn't already exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow authenticated users to view their own backup files.
-- Files are expected to be stored in a folder named after the user's ID. e.g., /backups/user-id/backup.json
CREATE POLICY "Allow users to view their own backups"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a policy to allow authenticated users to upload new backup files into their own folder.
CREATE POLICY "Allow users to upload to their own backup folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a policy to allow authenticated users to update their own backup files.
CREATE POLICY "Allow users to update their own backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a policy to allow authenticated users to delete their own backup files.
CREATE POLICY "Allow users to delete their own backups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backups' AND (storage.foldername(name))[1] = auth.uid()::text);
