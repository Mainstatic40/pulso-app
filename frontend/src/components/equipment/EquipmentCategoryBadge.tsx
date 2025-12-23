import { cn } from '../../lib/utils';
import type { EquipmentCategory } from '../../types';

interface EquipmentCategoryBadgeProps {
  category: EquipmentCategory;
  className?: string;
}

const categoryConfig: Record<EquipmentCategory, { label: string; className: string }> = {
  camera: {
    label: 'Cámara',
    className: 'bg-purple-100 text-purple-800',
  },
  lens: {
    label: 'Lente',
    className: 'bg-blue-100 text-blue-800',
  },
  adapter: {
    label: 'Adaptador',
    className: 'bg-gray-100 text-gray-800',
  },
  sd_card: {
    label: 'SD',
    className: 'bg-orange-100 text-orange-800',
  },
};

export function EquipmentCategoryBadge({ category, className }: EquipmentCategoryBadgeProps) {
  const config = categoryConfig[category];

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

export function getCategoryLabel(category: EquipmentCategory): string {
  return categoryConfig[category].label;
}

export const equipmentCategoryOptions = [
  { value: 'camera', label: 'Cámara' },
  { value: 'lens', label: 'Lente' },
  { value: 'adapter', label: 'Adaptador' },
  { value: 'sd_card', label: 'SD' },
];
