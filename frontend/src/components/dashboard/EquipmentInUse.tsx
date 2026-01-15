import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Aperture, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import type { EquipmentAssignment, EquipmentCategory } from '../../types';

const categoryConfig: Record<EquipmentCategory, { icon: React.ReactNode; color: string }> = {
  camera: { icon: <Camera className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
  lens: { icon: <Aperture className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
  adapter: { icon: <Package className="h-4 w-4" />, color: 'text-orange-600 bg-orange-100' },
  sd_card: { icon: <Package className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
};

const defaultConfig = { icon: <Package className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100' };

interface EquipmentInUseProps {
  assignments: EquipmentAssignment[];
  isLoading?: boolean;
  isBecario?: boolean;
  maxItems?: number;
}

export function EquipmentInUse({
  assignments,
  isLoading = false,
  isBecario = true,
  maxItems = 4
}: EquipmentInUseProps) {
  const displayAssignments = assignments.slice(0, maxItems);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Camera className="h-5 w-5 flex-shrink-0 text-green-600" />
          <span className="truncate">{isBecario ? 'Mis Equipos en Uso' : 'Equipos en Uso'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : displayAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">
              {isBecario ? 'No tienes equipos asignados' : 'Sin equipos en uso'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
              {displayAssignments.map((assignment) => {
                const equipment = assignment.equipment;
                if (!equipment) return null;

                const config = categoryConfig[equipment.category] || defaultConfig;
                const noteText = assignment.notes || '';

                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-gray-200 p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {equipment.name}
                        </p>
                        {equipment.serialNumber && (
                          <p className="truncate text-xs text-gray-400">
                            {equipment.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isBecario && assignment.user && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar name={assignment.user.name} size="sm" />
                        <span className="truncate text-xs text-gray-600">
                          {assignment.user.name}
                        </span>
                      </div>
                    )}

                    {noteText && (
                      <p className="mt-2 truncate text-xs text-gray-500" title={noteText}>
                        {noteText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {assignments.length > maxItems && (
              <Link
                to="/equipment"
                className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todos ({assignments.length})
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
