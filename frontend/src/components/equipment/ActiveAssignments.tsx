import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Calendar, Clock, RotateCcw, Package, Search, ChevronDown, ChevronRight, ClipboardList, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { EquipmentCategoryBadge } from './EquipmentCategoryBadge';
import { equipmentAssignmentService } from '../../services/equipment-assignment.service';
import { useAuthContext } from '../../stores/auth.store';
import type { EquipmentAssignment } from '../../types';

type FilterType = 'all' | 'events' | 'tasks' | 'unassigned';

// Classification helpers
const isEventAssignment = (a: EquipmentAssignment) => !!a.eventId;
const isTaskAssignment = (a: EquipmentAssignment) => a.notes?.startsWith('Tarea:') ?? false;
const isUnassigned = (a: EquipmentAssignment) => !a.eventId && !a.notes?.startsWith('Tarea:');
const extractTaskName = (notes: string) => notes.replace(/^Tarea:\s*/, '');

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getElapsedTime(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m`;
  }
  return `${diffMins}m`;
}

interface AssignmentRowProps {
  assignment: EquipmentAssignment;
  onReturn: (id: string) => void;
  isReturning: boolean;
  canReturn: boolean;
}

function AssignmentRow({ assignment, onReturn, isReturning, canReturn }: AssignmentRowProps) {
  const handleReturn = () => {
    if (window.confirm(`¿Devolver ${assignment.equipment?.name}?`)) {
      onReturn(assignment.id);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{assignment.equipment?.name}</span>
          {assignment.equipment && (
            <EquipmentCategoryBadge category={assignment.equipment.category} />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {assignment.user?.name}
          </span>
          {assignment.event && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {assignment.event.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(assignment.startTime)}
            <span className="text-xs text-gray-400">
              ({getElapsedTime(assignment.startTime)})
            </span>
          </span>
        </div>
        {assignment.notes && (
          <p className="mt-1 text-xs text-gray-400 italic">"{assignment.notes}"</p>
        )}
      </div>
      {canReturn && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReturn}
          isLoading={isReturning}
          className="shrink-0"
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Devolver
        </Button>
      )}
    </div>
  );
}

interface CollapsibleGroupProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleGroup({ title, icon, count, isExpanded, onToggle, children }: CollapsibleGroupProps) {
  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {count} equipo{count !== 1 ? 's' : ''}
        </span>
      </button>
      {isExpanded && (
        <div className="space-y-2 border-t border-gray-200 p-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function ActiveAssignments() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['equipment-assignments', { active: true }],
    queryFn: () => equipmentAssignmentService.getAll({ active: true, limit: 100 }),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => equipmentAssignmentService.returnEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  const assignments = data?.data || [];

  // Summary counts
  const summary = useMemo(() => ({
    total: assignments.length,
    events: assignments.filter(isEventAssignment).length,
    tasks: assignments.filter(isTaskAssignment).length,
    unassigned: assignments.filter(isUnassigned).length,
  }), [assignments]);

  // Filter by tab
  const filteredByTab = useMemo(() => {
    switch (activeFilter) {
      case 'events':
        return assignments.filter(isEventAssignment);
      case 'tasks':
        return assignments.filter(isTaskAssignment);
      case 'unassigned':
        return assignments.filter(isUnassigned);
      default:
        return assignments;
    }
  }, [assignments, activeFilter]);

  // Filter by search
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(a =>
      a.user?.name.toLowerCase().includes(query) ||
      a.equipment?.name.toLowerCase().includes(query)
    );
  }, [filteredByTab, searchQuery]);

  // Group assignments based on active filter
  const groupedAssignments = useMemo(() => {
    const grouped: Record<string, { icon: React.ReactNode; assignments: EquipmentAssignment[] }> = {};

    filteredAssignments.forEach((assignment) => {
      let groupKey: string;
      let icon: React.ReactNode;

      if (activeFilter === 'events' && assignment.event) {
        groupKey = assignment.event.name;
        icon = <Calendar className="h-4 w-4 text-blue-500" />;
      } else if (activeFilter === 'tasks' && assignment.notes) {
        groupKey = extractTaskName(assignment.notes);
        icon = <ClipboardList className="h-4 w-4 text-amber-500" />;
      } else {
        groupKey = assignment.user?.name || 'Sin usuario';
        icon = <User className="h-4 w-4 text-gray-500" />;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = { icon, assignments: [] };
      }
      grouped[groupKey].assignments.push(assignment);
    });

    return grouped;
  }, [filteredAssignments, activeFilter]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asignaciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asignaciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No hay equipos prestados actualmente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Asignaciones Activas
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-normal text-red-700">
            {assignments.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <strong>{summary.total}</strong> prestados
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-500" />
            <strong>{summary.events}</strong> en eventos
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4 text-amber-500" />
            <strong>{summary.tasks}</strong> en tareas
          </span>
          {summary.unassigned > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <FileQuestion className="h-4 w-4 text-gray-400" />
                <strong>{summary.unassigned}</strong> otros
              </span>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por usuario o equipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">
              Todos ({summary.total})
            </TabsTrigger>
            <TabsTrigger value="events">
              Por Evento ({summary.events})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Por Tarea ({summary.tasks})
            </TabsTrigger>
            <TabsTrigger value="unassigned">
              Sin asignar ({summary.unassigned})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Grouped assignments */}
        {filteredAssignments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Search className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2">No se encontraron asignaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedAssignments).map(([groupKey, { icon, assignments: groupAssignments }]) => (
              <CollapsibleGroup
                key={groupKey}
                title={groupKey}
                icon={icon}
                count={groupAssignments.length}
                isExpanded={expandedGroups.has(groupKey)}
                onToggle={() => toggleGroup(groupKey)}
              >
                {groupAssignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    onReturn={(id) => returnMutation.mutate(id)}
                    isReturning={returnMutation.isPending}
                    canReturn={canManage}
                  />
                ))}
              </CollapsibleGroup>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
