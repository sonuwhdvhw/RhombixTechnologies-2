-- ============================================================
-- SocialConnect - Storage Bucket Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

-- Storage RLS Policies

-- Anyone can view public media
CREATE POLICY IF NOT EXISTS "Public media viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Authenticated users can upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Users can update their own uploads
CREATE POLICY IF NOT EXISTS "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can delete their own uploads
CREATE POLICY IF NOT EXISTS "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
