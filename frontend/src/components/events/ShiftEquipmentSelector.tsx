import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Circle, Disc, HardDrive, Loader2 } from 'lucide-react';
import { Select } from '../ui/Select';
import { equipmentService } from '../../services/equipment.service';
import type { ShiftEquipment, Equipment, EquipmentCategory } from '../../types';

interface ShiftEquipmentSelectorProps {
  equipment: ShiftEquipment;
  onChange: (equipment: ShiftEquipment) => void;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  usePreset?: boolean;
  presetEquipment?: ShiftEquipment;
  disabled?: boolean;
  eventId?: string;
  // Equipment IDs already assigned in other overlapping shifts (from same form)
  excludeEquipmentIds?: string[];
}

interface CategoryConfig {
  key: keyof ShiftEquipment;
  category: EquipmentCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    key: 'cameraId',
    category: 'camera',
    label: 'Cámara',
    icon: <Camera className="h-4 w-4" />,
    color: 'text-blue-600',
  },
  {
    key: 'lensId',
    category: 'lens',
    label: 'Lente',
    icon: <Circle className="h-4 w-4" />,
    color: 'text-purple-600',
  },
  {
    key: 'adapterId',
    category: 'adapter',
    label: 'Adaptador',
    icon: <Disc className="h-4 w-4" />,
    color: 'text-orange-600',
  },
  {
    key: 'sdCardId',
    category: 'sd_card',
    label: 'SD',
    icon: <HardDrive className="h-4 w-4" />,
    color: 'text-green-600',
  },
];

function formatDateTimeISO(date: Date, time: string): string {
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}T${time}:00`;
}

export function ShiftEquipmentSelector({
  equipment,
  onChange,
  shiftDate,
  startTime,
  endTime,
  usePreset = false,
  presetEquipment,
  disabled = false,
  excludeEquipmentIds = [],
}: ShiftEquipmentSelectorProps) {
  // Build datetime strings for availability query
  const queryParams = useMemo(() => {
    if (!shiftDate || !startTime || !endTime) return null;

    return {
      startTime: formatDateTimeISO(shiftDate, startTime),
      endTime: formatDateTimeISO(shiftDate, endTime),
      excludeTasks: true,
    };
  }, [shiftDate, startTime, endTime]);

  // Query available equipment
  const { data: availableEquipment, isLoading } = useQuery({
    queryKey: ['equipment-available', 'event', queryParams],
    queryFn: () => equipmentService.getAvailable(queryParams!),
    enabled: !!queryParams,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<EquipmentCategory, Equipment[]> = {
      camera: [],
      lens: [],
      adapter: [],
      sd_card: [],
    };

    (availableEquipment || []).forEach((eq) => {
      if (grouped[eq.category]) {
        grouped[eq.category].push(eq);
      }
    });

    return grouped;
  }, [availableEquipment]);

  // Handle equipment change
  const handleChange = (key: keyof ShiftEquipment, value: string) => {
    // DEBUG: Log equipment selection
    const newEquipment = {
      ...equipment,
      [key]: value || undefined,
    };

    onChange(newEquipment);
  };

  // Get options for a category (filtering out excluded equipment)
  const getOptions = (category: EquipmentCategory, currentValue?: string) => {
    const items = equipmentByCategory[category] || [];
    // Filter out excluded equipment, but keep the current value if it's selected
    const filteredItems = items.filter(
      (eq) => !excludeEquipmentIds.includes(eq.id) || eq.id === currentValue
    );

    return [
      { value: '', label: 'Sin asignar' },
      ...filteredItems.map((eq) => {
        const isExcluded = excludeEquipmentIds.includes(eq.id) && eq.id !== currentValue;
        return {
          value: eq.id,
          label: isExcluded
            ? `${eq.name} (ya asignado)`
            : (eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name),
          disabled: isExcluded,
        };
      }),
    ];
  };

  // Check if a category should be disabled (preset mode)
  const isCategoryDisabled = (key: keyof ShiftEquipment): boolean => {
    if (disabled) return true;
    if (!usePreset) return false;
    // In preset mode, only SD card is selectable
    return key !== 'sdCardId';
  };

  // Get preset equipment name for display
  const getPresetEquipmentName = (key: keyof ShiftEquipment): string | null => {
    if (!usePreset || !presetEquipment) return null;
    const equipmentId = presetEquipment[key];
    if (!equipmentId) return null;

    const allEquipment = availableEquipment || [];
    const found = allEquipment.find((eq) => eq.id === equipmentId);
    return found?.name || 'Equipo preset';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando equipos disponibles...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CATEGORY_CONFIG.map((config) => {
        const isDisabled = isCategoryDisabled(config.key);
        const presetName = getPresetEquipmentName(config.key);
        const currentValue = equipment[config.key] || '';
        const options = getOptions(config.category, currentValue);
        const hasOptions = options.length > 1;

        return (
          <div key={config.key}>
            <label
              className={`mb-1 flex items-center gap-1 text-xs font-medium ${config.color}`}
            >
              {config.icon}
              {config.label}
            </label>

            {usePreset && isDisabled && presetName ? (
              // Show preset equipment as read-only
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {presetName}
              </div>
            ) : (
              <Select
                value={currentValue}
                onChange={(e) => handleChange(config.key, e.target.value)}
                options={options}
                disabled={isDisabled || !hasOptions}
                className="text-sm"
              />
            )}

            {!hasOptions && !isDisabled && (
              <p className="mt-1 text-xs text-gray-400">
                No disponible
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
