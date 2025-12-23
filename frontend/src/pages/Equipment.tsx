import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Camera, Loader2, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { EquipmentCard } from '../components/equipment/EquipmentCard';
import { EquipmentModal, CreateEquipmentModal } from '../components/equipment/EquipmentModal';
import { AssignEquipmentModal } from '../components/equipment/AssignEquipmentModal';
import { ActiveAssignments } from '../components/equipment/ActiveAssignments';
import { equipmentService } from '../services/equipment.service';
import { useAuthContext } from '../stores/auth.store';
import type { EquipmentCategory, EquipmentStatus } from '../types';

const categoryTabs: { value: EquipmentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'camera', label: 'Cámaras' },
  { value: 'lens', label: 'Lentes' },
  { value: 'adapter', label: 'Adaptadores' },
  { value: 'sd_card', label: 'SD' },
];

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'available', label: 'Disponible' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

export function Equipment() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  const canAssign = user?.role === 'admin' || user?.role === 'supervisor';

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', activeCategory, statusFilter],
    queryFn: () =>
      equipmentService.getAll({
        category: activeCategory === 'all' ? undefined : activeCategory,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      }),
  });

  const equipment = data?.data || [];

  const handleEquipmentClick = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-[#CC0000]" />
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
        </div>
        <div className="flex gap-2">
          {canAssign && (
            <Button variant="outline" onClick={() => setIsAssignModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Equipo
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Active Assignments */}
      <ActiveAssignments />

      {/* Tabs by category */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeCategory === tab.value
                  ? 'border-[#CC0000] text-[#CC0000]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
            options={statusOptions}
          />
        </div>
        <span className="text-sm text-gray-500">
          {equipment.length} equipo{equipment.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Equipment Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : equipment.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay equipos</h3>
          <p className="mt-2 text-sm text-gray-500">
            {activeCategory === 'all' && statusFilter === 'all'
              ? 'Aún no se han registrado equipos.'
              : 'No se encontraron equipos con los filtros seleccionados.'}
          </p>
          {isAdmin && activeCategory === 'all' && statusFilter === 'all' && (
            <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer equipo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onClick={() => handleEquipmentClick(item.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateEquipmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Assign Modal */}
      <AssignEquipmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
      />

      {/* View/Edit Modal */}
      <EquipmentModal
        equipmentId={selectedEquipmentId}
        isOpen={!!selectedEquipmentId}
        onClose={() => setSelectedEquipmentId(null)}
      />
    </div>
  );
}
