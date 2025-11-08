-- Function to safely register an entry without requiring admin role
CREATE OR REPLACE FUNCTION public.register_entry(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only register entry if the visitor is authorized and not expired
  UPDATE public.visitantes_autorizados
  SET last_entry = now()
  WHERE id = _id
    AND autorizado = true
    AND fecha_autorizacion >= CURRENT_DATE;
END;
$$;

-- Grant execute to public roles so the public page can call it
GRANT EXECUTE ON FUNCTION public.register_entry(uuid) TO anon, authenticated;

-- Ensure updated_at is kept current on updates (quality improvement)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_visitantes_autorizados_updated_at'
  ) THEN
    CREATE TRIGGER update_visitantes_autorizados_updated_at
    BEFORE UPDATE ON public.visitantes_autorizados
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;