/**
 * Utilidades para manejo seguro de fechas, evitando problemas de timezone
 */

/**
 * Parsea una fecha string de forma segura, evitando problemas de timezone.
 * JavaScript interpreta fechas sin hora como UTC midnight, lo que causa
 * que en zonas horarias negativas (como México UTC-6) las fechas aparezcan
 * un día antes.
 *
 * @param dateString - Fecha en formato ISO o YYYY-MM-DD
 * @returns Date object en hora local, o null si el string es inválido
 */
export function parseDateSafe(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  // Extraer solo YYYY-MM-DD para evitar interpretación UTC
  const datePart = dateString.split('T')[0];

  // Validar formato básico
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return null;
  }

  // Crear fecha a mediodía local para evitar cambios de día por timezone
  return new Date(datePart + 'T12:00:00');
}

/**
 * Obtiene la fecha relevante de una tarea para mostrar en calendario.
 * Prioriza executionDate (fecha de ejecución), si no existe usa dueDate (fecha límite).
 *
 * @param task - Objeto con executionDate opcional y dueDate obligatorio
 * @returns Date object de la fecha a usar en calendario
 */
export function getTaskCalendarDate(task: { executionDate?: string | null; dueDate: string }): Date {
  const dateToUse = task.executionDate || task.dueDate;
  return parseDateSafe(dateToUse) || new Date();
}

/**
 * Compara si dos fechas son el mismo día (ignorando hora).
 *
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si ambas fechas son el mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Verifica si una fecha es el día de hoy.
 *
 * @param date - Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Obtiene una cadena de fecha en formato YYYY-MM-DD desde un Date object.
 * Usa la hora local, no UTC.
 *
 * @param date - Date object
 * @returns String en formato YYYY-MM-DD
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
