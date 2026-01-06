import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;

  // Si ya es una URL completa, retornarla
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Obtener base URL del API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Quitar /api del FINAL de la URL (no usar replace que puede afectar el subdominio)
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  // Si es solo un nombre de archivo (sin ruta), asumir que es de profiles
  if (!path.includes('/')) {
    return `${baseUrl}/uploads/profiles/${path}`;
  }

  // Si ya tiene /uploads/ en el path
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Cualquier otro caso
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
