import { useState, useEffect } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { attachmentService } from '../../services/attachment.service';
import type { Attachment } from '../../types';

interface AttachmentPreviewModalProps {
  attachment: Attachment;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export function AttachmentPreviewModal({
  attachment,
  isOpen,
  onClose,
  onDownload,
}: AttachmentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canPreview = attachmentService.canPreview(attachment.mimeType);
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';
  const isVideo = attachment.mimeType.startsWith('video/');
  const isText = attachment.mimeType === 'text/plain';

  useEffect(() => {
    if (!isOpen || !canPreview) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    attachmentService
      .getPreviewUrl(attachment.id)
      .then((url) => {
        if (isMounted) {
          setPreviewUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading preview:', err);
          setError('Error al cargar la vista previa');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      // Clean up blob URL when closing
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, attachment.id, canPreview]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderPreview = () => {
    if (!canPreview) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText className="mb-4 h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium">Vista previa no disponible</p>
          <p className="mt-1 text-sm">Este tipo de archivo no soporta vista previa</p>
          <button
            type="button"
            onClick={onDownload}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            Descargar archivo
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        </div>
      );
    }

    if (error || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="mb-4 h-16 w-16 text-red-300" />
          <p className="text-lg font-medium">Error al cargar</p>
          <p className="mt-1 text-sm">{error || 'No se pudo cargar la vista previa'}</p>
          <button
            type="button"
            onClick={onDownload}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            Descargar archivo
          </button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={previewUrl}
            alt={attachment.filename}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={previewUrl}
          title={attachment.filename}
          className="h-[70vh] w-full"
        />
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center p-4">
          <video
            src={previewUrl}
            controls
            className="max-h-[70vh] max-w-full"
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      );
    }

    if (isText) {
      return (
        <iframe
          src={previewUrl}
          title={attachment.filename}
          className="h-[70vh] w-full bg-white font-mono text-sm"
        />
      );
    }

    return null;
  };

  return createPortal(
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
              {attachment.filename}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="flex min-h-[36px] items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 sm:min-h-0 sm:gap-1.5 sm:px-3 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:min-h-0 sm:min-w-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="bg-gray-100">
          {renderPreview()}
        </div>
      </div>
    </div>,
    document.body
  );
}
