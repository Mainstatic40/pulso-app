import { Flag, Church, Camera, Mic2 } from 'lucide-react';
import type { EventType } from '../../types';

interface EventTypeSelectorProps {
  value: EventType | null;
  onChange: (type: EventType) => void;
  disabled?: boolean;
}

interface EventTypeOption {
  type: EventType;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const eventTypeOptions: EventTypeOption[] = [
  {
    type: 'civic',
    icon: <Flag className="h-8 w-8" />,
    title: 'Cívico',
    description: 'Festivales, días patrios',
  },
  {
    type: 'church',
    icon: <Church className="h-8 w-8" />,
    title: 'Iglesia',
    description: 'Graduación, eventos ministerios',
  },
  {
    type: 'yearbook',
    icon: <Camera className="h-8 w-8" />,
    title: 'Foto de Anuario',
    description: 'Sesiones de fotos por turno',
  },
  {
    type: 'congress',
    icon: <Mic2 className="h-8 w-8" />,
    title: 'Congreso',
    description: 'Conferencias, talleres',
  },
];

export function EventTypeSelector({ value, onChange, disabled }: EventTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {eventTypeOptions.map((option) => {
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            disabled={disabled}
            className={`
              flex flex-col items-center rounded-lg border-2 p-4 text-center transition-all
              ${
                isSelected
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div
              className={`mb-2 ${isSelected ? 'text-red-600' : 'text-gray-500'}`}
            >
              {option.icon}
            </div>
            <h3
              className={`text-sm font-semibold ${
                isSelected ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {option.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
