-- Create table for authorized visitors
CREATE TABLE public.visitantes_autorizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  empresa TEXT,
  fecha_autorizacion DATE NOT NULL DEFAULT CURRENT_DATE,
  autorizado BOOLEAN NOT NULL DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.visitantes_autorizados ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no authentication required)
CREATE POLICY "Public read access for visitors" 
ON public.visitantes_autorizados 
FOR SELECT 
USING (true);

-- Create index on cedula for faster lookups
CREATE INDEX idx_visitantes_cedula ON public.visitantes_autorizados(cedula);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visitantes_updated_at
BEFORE UPDATE ON public.visitantes_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.visitantes_autorizados (cedula, nombre, empresa, fecha_autorizacion, autorizado, observaciones) VALUES
('123456789', 'Juan Pérez', 'Empresa ABC', '2025-12-31', true, 'Acceso permanente'),
('987654321', 'María González', 'Proveedor XYZ', '2025-06-30', true, 'Contrato vigente'),
('555666777', 'Carlos Ramírez', NULL, '2025-03-15', false, 'Autorización vencida');