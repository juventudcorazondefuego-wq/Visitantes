-- Create storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visitor-photos', 'visitor-photos', true);

-- Create storage policies for visitor photos
CREATE POLICY "Visitor photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'visitor-photos');

CREATE POLICY "Admins can upload visitor photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'visitor-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can update visitor photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'visitor-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can delete visitor photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'visitor-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Add photo_url and last_entry columns to visitantes_autorizados
ALTER TABLE visitantes_autorizados 
ADD COLUMN photo_url text,
ADD COLUMN last_entry timestamp with time zone;