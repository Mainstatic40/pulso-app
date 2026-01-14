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
  const { data: availableEquipment, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['equipment-available', 'event', queryParams],
    queryFn: () => equipmentService.getAvailable(queryParams!),
    enabled: !!queryParams,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Also query ALL active equipment to ensure current selections are always shown
  const { data: allEquipmentResponse, isLoading: isLoadingAll } = useQuery({
    queryKey: ['equipment', { isActive: true, limit: 100 }],
    queryFn: () => equipmentService.getAll({ isActive: true, limit: 100 }),
    staleTime: 60000, // Cache for 1 minute
  });

  const allEquipment = allEquipmentResponse?.data || [];
  const isLoading = isLoadingAvailable || isLoadingAll;

  // Create a set of available equipment IDs for quick lookup
  const availableIds = useMemo(() => {
    return new Set((availableEquipment || []).map(eq => eq.id));
  }, [availableEquipment]);

  // Group ALL equipment by category, marking availability
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<EquipmentCategory, Array<Equipment & { isAvailable: boolean }>> = {
      camera: [],
      lens: [],
      adapter: [],
      sd_card: [],
    };

    allEquipment.forEach((eq) => {
      if (grouped[eq.category]) {
        grouped[eq.category].push({
          ...eq,
          isAvailable: availableIds.has(eq.id),
        });
      }
    });

    return grouped;
  }, [allEquipment, availableIds]);

  // Handle equipment change
  const handleChange = (key: keyof ShiftEquipment, value: string) => {
    // DEBUG: Log equipment selection
    const newEquipment = {
      ...equipment,
      [key]: value || undefined,
    };

    onChange(newEquipment);
  };

  // Get options for a category (showing all equipment, marking unavailable ones)
  const getOptions = (category: EquipmentCategory, currentValue?: string) => {
    const items = equipmentByCategory[category] || [];

    return [
      { value: '', label: 'Sin asignar' },
      ...items.map((eq) => {
        const isCurrentSelection = eq.id === currentValue;
        const isExcludedInForm = excludeEquipmentIds.includes(eq.id) && !isCurrentSelection;
        const isUnavailable = !eq.isAvailable && !isCurrentSelection;

        // Determine label suffix
        let labelSuffix = '';
        if (isExcludedInForm) {
          labelSuffix = ' (en otro turno)';
        } else if (isUnavailable) {
          labelSuffix = ' (no disponible)';
        }

        const baseName = eq.serialNumber ? `${eq.name} (${eq.serialNumber})` : eq.name;

        return {
          value: eq.id,
          label: baseName + labelSuffix,
          // Current selection should never be disabled
          disabled: isCurrentSelection ? false : (isExcludedInForm || isUnavailable),
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
