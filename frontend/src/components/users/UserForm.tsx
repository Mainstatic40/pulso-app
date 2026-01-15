import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Trash2, Upload, CreditCard, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { userService } from '../../services/user.service';
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
  onUserUpdate?: (user: User) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'becario', label: 'Becario' },
];

export function UserForm({ user, onSubmit, onCancel, isLoading, onUserUpdate }: UserFormProps) {
  const isEditing = !!user;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [imageError, setImageError] = useState<string | null>(null);

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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => userService.uploadProfileImage(user!.id, file),
    onSuccess: (updatedUser) => {
      setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onUserUpdate?.(updatedUser);
      setImageError(null);
    },
    onError: (error: Error) => {
      setImageError(error.message || 'Error al subir la imagen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => userService.deleteProfileImage(user!.id),
    onSuccess: (updatedUser) => {
      setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onUserUpdate?.(updatedUser);
      setImageError(null);
    },
    onError: (error: Error) => {
      setImageError(error.message || 'Error al eliminar la imagen');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('La imagen no debe superar 20MB');
      return;
    }

    uploadMutation.mutate(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = () => {
    if (window.confirm('¿Eliminar la foto de perfil?')) {
      deleteMutation.mutate();
    }
  };

  const isImageLoading = uploadMutation.isPending || deleteMutation.isPending;

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5">
      {/* Profile Image Section - Only shown when editing */}
      {isEditing && currentUser && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:gap-4 sm:p-4">
          <div className="relative">
            <Avatar
              name={currentUser.name}
              profileImage={currentUser.profileImage}
              size="lg"
              className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl"
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageLoading}
              className="text-xs sm:text-sm"
            >
              <Upload className="mr-1 h-3.5 w-3.5 sm:mr-1.5" />
              {currentUser.profileImage ? 'Cambiar' : 'Subir foto'}
            </Button>
            {currentUser.profileImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteImage}
                disabled={isImageLoading}
                className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 sm:text-sm"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5 sm:mr-1.5" />
                Eliminar
              </Button>
            )}
          </div>

          {imageError && (
            <p className="text-xs text-red-600 sm:text-sm">{imageError}</p>
          )}

          <p className="text-[10px] text-gray-500 sm:text-xs">JPG, PNG o WebP. Máximo 20MB</p>
        </div>
      )}

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

      {/* RFID Status - Read only with link to management */}
      {isEditing && (
        <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <CreditCard className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 sm:text-sm">Credencial RFID</p>
                {currentUser?.rfidTag ? (
                  <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
                    <span className="truncate text-xs text-green-700 sm:text-sm">
                      Vinculada: {currentUser.rfidTag.length > 6
                        ? `${currentUser.rfidTag.slice(0, 4)}...${currentUser.rfidTag.slice(-2)}`
                        : currentUser.rfidTag}
                    </span>
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">
                    <XCircle className="h-3.5 w-3.5 text-gray-400 sm:h-4 sm:w-4" />
                    <span className="text-xs text-gray-500 sm:text-sm">Sin credencial vinculada</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              to="/rfid"
              className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-blue-600 hover:bg-gray-50 hover:text-blue-700 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
            >
              Gestionar
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-1">
        <input
          type="checkbox"
          id="isActive"
          className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 sm:h-4 sm:w-4"
          {...register('isActive')}
        />
        <label htmlFor="isActive" className="text-xs text-gray-700 sm:text-sm">
          Usuario activo
        </label>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3 sm:pt-5">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          {isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
