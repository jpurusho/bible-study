-- Create temp-uploads storage bucket for AI image processing
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-uploads', 'temp-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload/read/delete
CREATE POLICY "Admins can upload temp files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'temp-uploads' AND public.is_admin());

CREATE POLICY "Admins can read temp files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'temp-uploads' AND public.is_admin());

CREATE POLICY "Admins can delete temp files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'temp-uploads' AND public.is_admin());
