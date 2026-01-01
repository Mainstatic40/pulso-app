import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, X, Upload } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { userService } from '../../services/user.service';
import type { User } from '../../types';

interface ProfileImageUploadProps {
  user: User;
  onUpdate?: (user: User) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfileImageUpload({ user, onUpdate }: ProfileImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => userService.uploadProfileImage(user.id, file),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      onUpdate?.(updatedUser);
      handleClose();
    },
    onError: (error: Error) => {
      setError(error.message || 'Error al subir la imagen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => userService.deleteProfileImage(user.id),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      onUpdate?.(updatedUser);
      handleClose();
    },
    onError: (error: Error) => {
      setError(error.message || 'Error al eliminar la imagen');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('La imagen no debe superar 20MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = () => {
    if (window.confirm('¿Eliminar tu foto de perfil?')) {
      deleteMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative"
        title="Cambiar foto de perfil"
      >
        <Avatar name={user.name} profileImage={user.profileImage} size="lg" />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-4 w-4 text-white" />
        </div>
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Foto de perfil">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-32 w-32 rounded-full object-cover"
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Avatar name={user.name} profileImage={user.profileImage} size="lg" className="h-32 w-32 text-3xl" />
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar imagen
              </Button>

              {user.profileImage && !previewUrl && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isLoading}
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-gray-500">
              Formatos: JPG, PNG, WebP. Tamaño máximo: 20MB
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {selectedFile && (
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                isLoading={uploadMutation.isPending}
                disabled={isLoading}
              >
                Guardar
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
