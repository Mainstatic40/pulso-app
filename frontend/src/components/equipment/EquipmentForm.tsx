import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { equipmentCategoryOptions } from './EquipmentCategoryBadge';
import { equipmentStatusOptions } from './EquipmentStatusBadge';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../../types';
import type { CreateEquipmentRequest, UpdateEquipmentRequest } from '../../services/equipment.service';

const createEquipmentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  category: z.enum(['camera', 'lens', 'adapter', 'sd_card'], {
    errorMap: () => ({ message: 'Selecciona una categoría' }),
  }),
  serialNumber: z.string().max(100, 'Máximo 100 caracteres').optional(),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  status: z.enum(['available', 'in_use', 'maintenance']).optional(),
});

type EquipmentFormData = z.infer<typeof createEquipmentSchema>;

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: CreateEquipmentRequest | UpdateEquipmentRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EquipmentForm({ equipment, onSubmit, onCancel, isLoading }: EquipmentFormProps) {
  const isEditing = !!equipment;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      name: equipment?.name || '',
      category: equipment?.category || undefined,
      serialNumber: equipment?.serialNumber || '',
      description: equipment?.description || '',
      status: equipment?.status || 'available',
    },
  });

  const handleFormSubmit = (data: EquipmentFormData) => {
    const submitData: CreateEquipmentRequest | UpdateEquipmentRequest = {
      name: data.name,
      category: data.category as EquipmentCategory,
      serialNumber: data.serialNumber || null,
      description: data.description || null,
    };

    if (isEditing && data.status) {
      (submitData as UpdateEquipmentRequest).status = data.status as EquipmentStatus;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4 sm:p-6">
      <Input
        label="Nombre"
        placeholder="Ej: Canon R5, Sigma 24-70mm"
        error={errors.name?.message}
        {...register('name')}
      />

      <Select
        label="Categoría"
        options={equipmentCategoryOptions}
        error={errors.category?.message}
        {...register('category')}
      />

      <Input
        label="Número de serie (opcional)"
        placeholder="Ej: ABC123456"
        error={errors.serialNumber?.message}
        {...register('serialNumber')}
      />

      <Textarea
        label="Descripción (opcional)"
        placeholder="Notas adicionales sobre el equipo..."
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />

      {isEditing && (
        <Select
          label="Estado"
          options={equipmentStatusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          {isEditing ? 'Guardar cambios' : 'Crear equipo'}
        </Button>
      </div>
    </form>
  );
}
