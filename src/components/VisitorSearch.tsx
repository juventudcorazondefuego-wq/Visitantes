import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Calendar, Building, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Visitante {
  id: string;
  cedula: string;
  nombre: string;
  empresa: string | null;
  fecha_autorizacion: string;
  autorizado: boolean;
  observaciones: string | null;
  additional_data: any;
  photo_url: string | null;
  last_entry: string | null;
}

interface CustomField {
  field_name: string;
  field_label: string;
  field_type: string;
}

export const VisitorSearch = () => {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Visitante | null>(null);
  const [searchDate] = useState(new Date());
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [photoEnlarged, setPhotoEnlarged] = useState(false);

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    const { data } = await supabase
      .from('custom_fields_config')
      .select('field_name, field_label, field_type')
      .order('display_order');
    
    if (data) {
      setCustomFields(data);
    }
  };

  const handleSearch = async () => {
    if (!cedula.trim()) {
      toast.error("Por favor ingrese un número de cédula");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("visitantes_autorizados")
        .select("*")
        .eq("cedula", cedula.trim())
        .maybeSingle();

      if (error) throw error;

      setResult(data);

      if (!data) {
        toast.error("Visitante no encontrado");
      }
    } catch (error) {
      console.error("Error al buscar visitante:", error);
      toast.error("Error al realizar la consulta");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEntry = async () => {
    if (!result) return;

    try {
      // Call the secure database function to register entry
      const { error } = await supabase.rpc('register_entry', {
        _id: result.id
      });

      if (error) throw error;

      toast.success("Ingreso registrado correctamente");
      
      // Refresh the result to show updated last_entry
      const { data } = await supabase
        .from("visitantes_autorizados")
        .select("*")
        .eq("id", result.id)
        .single();
      
      if (data) setResult(data);
    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      toast.error("Error al registrar ingreso");
    }
  };

  const handleClear = () => {
    setCedula("");
    setResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isAuthorized = result && result.autorizado;
  const isExpired = result && new Date(result.fecha_autorizacion) < new Date();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <Card className="border-2 border-border shadow-lg">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <label htmlFor="cedula" className="text-base sm:text-lg font-semibold text-foreground block">
              Buscar por Cédula
            </label>
            <Input
              id="cedula"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ingrese número de cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base sm:text-lg h-12 sm:h-14 border-2 w-full"
              disabled={loading}
            />
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleSearch}
                disabled={loading}
                size="lg"
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold"
              >
                <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {loading ? "Consultando..." : "Consultar"}
              </Button>
              {(result || cedula) && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-14 px-4 sm:px-8"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={`border-4 shadow-xl ${
            isAuthorized && !isExpired
              ? "border-success bg-success/5"
              : "border-destructive bg-destructive/5"
          }`}
        >
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 w-full">
                  {result.photo_url && (
                    <img
                      src={result.photo_url}
                      alt={result.nombre}
                      onClick={() => setPhotoEnlarged(true)}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  )}
                  {isAuthorized && !isExpired ? (
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-success flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2
                      className={`text-lg sm:text-2xl font-bold mb-1 sm:mb-2 ${
                        isAuthorized && !isExpired ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isAuthorized && !isExpired
                        ? "✅ Visitante Autorizado"
                        : "🚫 Acceso No Autorizado"}
                    </h2>
                    <p className="text-base sm:text-xl font-semibold text-foreground break-words">{result.nombre}</p>
                    <p className="text-sm sm:text-base text-muted-foreground break-all">Cédula: {result.cedula}</p>
                  </div>
                </div>
                {isAuthorized && !isExpired && (
                  <Button 
                    onClick={handleRegisterEntry} 
                    size="lg"
                    className="w-full sm:w-auto sm:whitespace-nowrap h-12 sm:h-14"
                  >
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Registrar Ingreso
                  </Button>
                )}
              </div>

              <div className="space-y-2 pt-3 sm:pt-4 border-t">
                {result.empresa && (
                  <div className="flex items-start gap-2 text-foreground text-sm sm:text-base">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Empresa: {result.empresa}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-foreground text-sm sm:text-base">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                  <span className="break-words">
                    Autorizado hasta:{" "}
                    {new Date(result.fecha_autorizacion).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {isExpired && (
                  <div className="flex items-start gap-2 text-destructive font-semibold text-sm sm:text-base">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                    <span>Autorización vencida</span>
                  </div>
                )}
                
                {customFields.map((field) => {
                  const value = result.additional_data?.[field.field_name];
                  if (!value) return null;
                  
                  return (
                    <div key={field.field_name} className="text-foreground text-sm sm:text-base break-words">
                      <strong>{field.field_label}:</strong>{" "}
                      {field.field_type === 'boolean' ? (value ? 'Sí' : 'No') : value}
                    </div>
                  );
                })}
                
                {result.observaciones && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      <strong>Observaciones:</strong> {result.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result === null && cedula && !loading && (
        <Card className="border-4 border-destructive bg-destructive/5 shadow-xl">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-destructive mb-1 break-words">
                  🚫 Visitante No Encontrado
                </h2>
                <p className="text-sm sm:text-base text-foreground break-words">
                  No existe registro para la cédula ingresada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result !== null && (
        <div className="text-center text-xs sm:text-sm text-muted-foreground px-2">
          Consulta realizada: {searchDate.toLocaleString("es-ES")}
        </div>
      )}

      <Dialog open={photoEnlarged} onOpenChange={setPhotoEnlarged}>
        <DialogContent className="max-w-3xl p-2">
          {result?.photo_url && (
            <img
              src={result.photo_url}
              alt={result.nombre}
              onClick={() => setPhotoEnlarged(false)}
              className="w-full h-auto rounded-lg cursor-pointer"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
