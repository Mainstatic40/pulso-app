import { toPng } from 'html-to-image';

export async function exportTaskToImage(
  element: HTMLElement,
  taskTitle: string
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2, // Better resolution
      backgroundColor: '#ffffff',
      cacheBust: true, // Avoid cache issues
    });

    // Create download link
    const link = document.createElement('a');
    const sanitizedTitle = taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    link.download = `tarea-${sanitizedTitle}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error al exportar imagen:', error);
    throw error;
  }
}
