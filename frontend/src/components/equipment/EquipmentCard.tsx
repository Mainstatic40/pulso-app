import { User, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { EquipmentStatusBadge } from './EquipmentStatusBadge';
import { EquipmentCategoryBadge } from './EquipmentCategoryBadge';
import type { Equipment } from '../../types';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
}

export function EquipmentCard({ equipment, onClick }: EquipmentCardProps) {
  const activeAssignment = equipment.assignments?.[0];

  return (
    <Card
      className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-gray-900">{equipment.name}</h3>
            {equipment.serialNumber && (
              <p className="mt-1 text-sm text-gray-500">
                S/N: {equipment.serialNumber}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EquipmentStatusBadge status={equipment.status} />
          <EquipmentCategoryBadge category={equipment.category} />
        </div>

        {equipment.description && (
          <p className="mt-3 line-clamp-2 text-sm text-gray-500">
            {equipment.description}
          </p>
        )}

        {activeAssignment && (
          <div className="mt-3 rounded-md bg-red-50 p-2">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{activeAssignment.user?.name}</span>
            </div>
            {activeAssignment.event && (
              <div className="mt-1 flex items-center gap-2 text-sm text-red-600">
                <Calendar className="h-4 w-4" />
                <span>{activeAssignment.event.name}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
