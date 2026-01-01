import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Download, Trash2, FileText, Image, FileSpreadsheet, FileVideo, File, Upload, X, Eye } from 'lucide-react';
import { attachmentService } from '../../services/attachment.service';
import { useAuthContext } from '../../stores/auth.store.tsx';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import type { Attachment } from '../../types';

interface AttachmentsListProps {
  attachments: Attachment[];
  taskId?: string;
  eventId?: string;
  queryKey: string[];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType.startsWith('video/')) {
    return <FileVideo className="h-5 w-5 text-orange-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function AttachmentsList({ attachments, taskId, eventId, queryKey }: AttachmentsListProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => attachmentService.upload(files, { taskId, eventId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.delete(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(Array.from(files));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(Array.from(files));
    }
  }, [uploadMutation]);

  const handleDownload = async (attachment: Attachment) => {
    try {
      await attachmentService.download(attachment.id, attachment.filename);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
  };

  const handleDelete = (attachmentId: string) => {
    if (window.confirm('¿Eliminar este archivo?')) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const canDelete = (attachment: Attachment) => {
    return user?.id === attachment.uploadedBy || user?.role === 'admin';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Paperclip className="h-4 w-4" />
        Archivos adjuntos ({attachments.length})
      </h3>

      {/* Files list */}
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              {/* File icon */}
              <div className="flex-shrink-0">
                {getFileIcon(attachment.mimeType)}
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {attachment.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)} · Subido por {attachment.uploader?.name || 'Desconocido'} · {formatRelativeTime(attachment.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePreview(attachment)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  title="Vista previa"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </button>
                {canDelete(attachment) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {uploadMutation.isPending ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
            Subiendo...
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gray-400" />
            <p className="mt-1 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-red-600 hover:text-red-700"
              >
                Agregar archivo
              </button>
              {' '}o arrastra aquí
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Máx. 10 MB · Imágenes, PDF, documentos, videos
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,video/mp4,video/quicktime"
        />
      </div>

      {/* Error message */}
      {uploadMutation.isError && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          <X className="h-4 w-4" />
          Error al subir archivo. Intenta de nuevo.
        </div>
      )}

      {/* Preview Modal */}
      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          onDownload={() => handleDownload(previewAttachment)}
        />
      )}
    </div>
  );
}
