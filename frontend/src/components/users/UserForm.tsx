import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { User } from '../../types';

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'supervisor', 'becario'], {
    required_error: 'El rol es requerido',
  }),
  rfidTag: z.string().optional(),
  isActive: z.boolean(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  role: z.enum(['admin', 'supervisor', 'becario'], {
    required_error: 'El rol es requerido',
  }),
  rfidTag: z.string().optional(),
  isActive: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;
type UserFormData = CreateUserFormData | UpdateUserFormData;

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'becario', label: 'Becario' },
];

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'becario',
      rfidTag: user?.rfidTag || '',
      isActive: user?.isActive ?? true,
    },
  });

  const handleFormSubmit = (data: UserFormData) => {
    // Clean up data before sending
    const cleanData: Record<string, any> = {
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      isActive: data.isActive,
    };

    // Only include password if provided (required for create, optional for update)
    if (data.password && data.password.trim() !== '') {
      cleanData.password = data.password;
    }

    // Only include rfidTag if provided (not empty string)
    if (data.rfidTag && data.rfidTag.trim() !== '') {
      cleanData.rfidTag = data.rfidTag.trim();
    }

    onSubmit(cleanData as UserFormData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Nombre completo"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="juan@universidad.edu.mx"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        type="password"
        placeholder={isEditing ? 'Dejar vacío para mantener' : '••••••••'}
        error={errors.password?.message}
        {...register('password')}
      />

      <Select
        label="Rol"
        options={roleOptions}
        error={errors.role?.message}
        {...register('role')}
      />

      <Input
        label="Tag RFID (opcional)"
        placeholder="ABC123456"
        error={errors.rfidTag?.message}
        {...register('rfidTag')}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          {...register('isActive')}
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Usuario activo
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
