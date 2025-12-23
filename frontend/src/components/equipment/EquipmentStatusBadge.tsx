import { cn } from '../../lib/utils';
import type { EquipmentStatus } from '../../types';

interface EquipmentStatusBadgeProps {
  status: EquipmentStatus;
  className?: string;
}

const statusConfig: Record<EquipmentStatus, { label: string; className: string }> = {
  available: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-800',
  },
  in_use: {
    label: 'En uso',
    className: 'bg-red-100 text-red-800',
  },
  maintenance: {
    label: 'Mantenimiento',
    className: 'bg-yellow-100 text-yellow-800',
  },
};

export function EquipmentStatusBadge({ status, className }: EquipmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: EquipmentStatus): string {
  return statusConfig[status].label;
}

export const equipmentStatusOptions = [
  { value: 'available', label: 'Disponible' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
];
