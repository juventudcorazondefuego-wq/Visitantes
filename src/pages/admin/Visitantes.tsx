import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Visitor {
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
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  field_options: any;
}

export default function Visitantes() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    empresa: '',
    fecha_autorizacion: new Date().toISOString().split('T')[0],
    autorizado: true,
    observaciones: '',
    additional_data: {} as Record<string, any>,
    photo_url: null as string | null,
  });

  useEffect(() => {
    loadVisitors();
    loadCustomFields();
  }, []);

  const loadVisitors = async () => {
    const { data, error } = await supabase
      .from('visitantes_autorizados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar visitantes');
    } else {
      setVisitors(data || []);
    }
  };

  const loadCustomFields = async () => {
    const { data } = await supabase
      .from('custom_fields_config')
      .select('*')
      .order('display_order');

    if (data) {
      setCustomFields(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let photoUrl = formData.photo_url;

    // Upload photo if there's a new file
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${formData.cedula}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visitor-photos')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) {
        toast.error('Error al subir la foto');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('visitor-photos')
        .getPublicUrl(filePath);

      photoUrl = publicUrl;
    }

    const dataToSave = { ...formData, photo_url: photoUrl };

    if (editingVisitor) {
      const { error } = await supabase
        .from('visitantes_autorizados')
        .update(dataToSave)
        .eq('id', editingVisitor.id);

      if (error) {
        toast.error('Error al actualizar visitante');
      } else {
        toast.success('Visitante actualizado');
        loadVisitors();
        closeDialog();
      }
    } else {
      const { error } = await supabase
        .from('visitantes_autorizados')
        .insert([dataToSave]);

      if (error) {
        toast.error('Error al crear visitante');
      } else {
        toast.success('Visitante creado');
        loadVisitors();
        closeDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este visitante?')) {
      const { error } = await supabase
        .from('visitantes_autorizados')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error al eliminar visitante');
      } else {
        toast.success('Visitante eliminado');
        loadVisitors();
      }
    }
  };

  const openDialog = (visitor?: Visitor) => {
    if (visitor) {
      setEditingVisitor(visitor);
      setFormData({
        cedula: visitor.cedula,
        nombre: visitor.nombre,
        empresa: visitor.empresa || '',
        fecha_autorizacion: visitor.fecha_autorizacion,
        autorizado: visitor.autorizado,
        observaciones: visitor.observaciones || '',
        additional_data: visitor.additional_data || {},
        photo_url: visitor.photo_url,
      });
      setPhotoPreview(visitor.photo_url);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVisitor(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      cedula: '',
      nombre: '',
      empresa: '',
      fecha_autorizacion: new Date().toISOString().split('T')[0],
      autorizado: true,
      observaciones: '',
      additional_data: {},
      photo_url: null,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredVisitors = visitors.filter(v =>
    v.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Visitantes</h1>
          <p className="text-muted-foreground">Administre los visitantes autorizados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVisitor ? 'Editar Visitante' : 'Nuevo Visitante'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Foto del Visitante</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Vista previa"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Autorización *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha_autorizacion}
                    onChange={(e) => setFormData({ ...formData, fecha_autorizacion: e.target.value })}
                    required
                  />
                </div>
              </div>

              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.field_name}>
                    {field.field_label} {field.is_required && '*'}
                  </Label>
                  {field.field_type === 'textarea' ? (
                    <Textarea
                      id={field.field_name}
                      value={formData.additional_data[field.field_name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        additional_data: { ...formData.additional_data, [field.field_name]: e.target.value }
                      })}
                      required={field.is_required}
                    />
                  ) : field.field_type === 'boolean' ? (
                    <Switch
                      checked={formData.additional_data[field.field_name] || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        additional_data: { ...formData.additional_data, [field.field_name]: checked }
                      })}
                    />
                  ) : (
                    <Input
                      id={field.field_name}
                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                      value={formData.additional_data[field.field_name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        additional_data: { ...formData.additional_data, [field.field_name]: e.target.value }
                      })}
                      required={field.is_required}
                    />
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autorizado"
                  checked={formData.autorizado}
                  onCheckedChange={(checked) => setFormData({ ...formData, autorizado: checked })}
                />
                <Label htmlFor="autorizado">Autorizado</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVisitor ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cédula, nombre o empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisitors.map((visitor) => (
              <TableRow key={visitor.id}>
                <TableCell className="font-mono">{visitor.cedula}</TableCell>
                <TableCell>{visitor.nombre}</TableCell>
                <TableCell>{visitor.empresa || '-'}</TableCell>
                <TableCell>{new Date(visitor.fecha_autorizacion).toLocaleDateString()}</TableCell>
                <TableCell>
                  {visitor.autorizado ? (
                    <Badge style={{ backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))' }}>Autorizado</Badge>
                  ) : (
                    <Badge variant="destructive">No Autorizado</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(visitor)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(visitor.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
