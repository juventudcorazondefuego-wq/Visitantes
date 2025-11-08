import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
}

export default function CustomFields() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    display_order: 0,
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    const { data, error } = await supabase
      .from('custom_fields_config')
      .select('*')
      .order('display_order');

    if (error) {
      toast.error('Error al cargar campos');
    } else {
      setFields(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldData = {
      ...formData,
      field_name: formData.field_name.toLowerCase().replace(/\s+/g, '_'),
    };

    if (editingField) {
      const { error } = await supabase
        .from('custom_fields_config')
        .update(fieldData)
        .eq('id', editingField.id);

      if (error) {
        toast.error('Error al actualizar campo');
      } else {
        toast.success('Campo actualizado');
        loadFields();
        closeDialog();
      }
    } else {
      const { error } = await supabase
        .from('custom_fields_config')
        .insert([fieldData]);

      if (error) {
        toast.error('Error al crear campo');
      } else {
        toast.success('Campo creado');
        loadFields();
        closeDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este campo? Los datos ya ingresados no se perderán, pero el campo no se mostrará en los formularios.')) {
      const { error } = await supabase
        .from('custom_fields_config')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error al eliminar campo');
      } else {
        toast.success('Campo eliminado');
        loadFields();
      }
    }
  };

  const openDialog = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFormData({
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        display_order: field.display_order,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingField(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      display_order: fields.length,
    });
  };

  const fieldTypeLabels: Record<string, string> = {
    text: 'Texto corto',
    textarea: 'Texto largo',
    number: 'Número',
    date: 'Fecha',
    boolean: 'Sí/No',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campos Personalizados</h1>
          <p className="text-muted-foreground">Configure campos adicionales para los visitantes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Campo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingField ? 'Editar Campo' : 'Nuevo Campo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field_label">Etiqueta del Campo *</Label>
                <Input
                  id="field_label"
                  placeholder="Ej: Número de Placa"
                  value={formData.field_label}
                  onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_name">Nombre Técnico *</Label>
                <Input
                  id="field_name"
                  placeholder="numero_placa"
                  value={formData.field_name}
                  onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                  required
                  disabled={!!editingField}
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones bajos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_type">Tipo de Campo *</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value) => setFormData({ ...formData, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto corto</SelectItem>
                    <SelectItem value="textarea">Texto largo</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="boolean">Sí/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Orden de Visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
                <Label htmlFor="is_required">Campo requerido</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingField ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etiqueta</TableHead>
              <TableHead>Nombre Técnico</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Requerido</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.field_label}</TableCell>
                <TableCell className="font-mono text-sm">{field.field_name}</TableCell>
                <TableCell>{fieldTypeLabels[field.field_type]}</TableCell>
                <TableCell>
                  {field.is_required ? (
                    <Badge variant="secondary">Sí</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell>{field.display_order}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(field)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(field.id)}
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
