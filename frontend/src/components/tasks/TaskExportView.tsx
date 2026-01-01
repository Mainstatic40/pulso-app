import { forwardRef } from 'react';
import type { TaskWithRelations } from '../../services/task.service';
import type { EquipmentCategory, TaskChecklistItem } from '../../types';

interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
}

interface ShiftEquipment {
  morning: EquipmentItem[];
  afternoon: EquipmentItem[];
}

interface EquipmentByUser {
  userId: string;
  userName: string;
  shifts: ShiftEquipment;
}

interface TaskExportViewProps {
  task: TaskWithRelations;
  equipmentByUser?: EquipmentByUser[];
}

const statusLabels: Record<string, { label: string; emoji: string }> = {
  pending: { label: 'Pendiente', emoji: '⏳' },
  in_progress: { label: 'En Progreso', emoji: '🔄' },
  review: { label: 'En Revisión', emoji: '👀' },
  completed: { label: 'Completado', emoji: '✅' },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'Alta', color: '#DC2626' },
  medium: { label: 'Media', color: '#F59E0B' },
  low: { label: 'Baja', color: '#22C55E' },
};

function formatDateLong(dateString: string): string {
  const datePart = dateString.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrentDateTime(): string {
  const now = new Date();
  return now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' a las ' + now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getShiftLabel(shift: string, morningStart?: string, morningEnd?: string, afternoonStart?: string, afternoonEnd?: string): string {
  if (shift === 'morning' && morningStart && morningEnd) {
    return `Mañana (${morningStart} - ${morningEnd})`;
  }
  if (shift === 'afternoon' && afternoonStart && afternoonEnd) {
    return `Tarde (${afternoonStart} - ${afternoonEnd})`;
  }
  if (shift === 'both') {
    const parts: string[] = [];
    if (morningStart && morningEnd) parts.push(`Mañana (${morningStart} - ${morningEnd})`);
    if (afternoonStart && afternoonEnd) parts.push(`Tarde (${afternoonStart} - ${afternoonEnd})`);
    return parts.join(' y ');
  }
  return '';
}

export const TaskExportView = forwardRef<HTMLDivElement, TaskExportViewProps>(
  ({ task, equipmentByUser = [] }, ref) => {
    const status = statusLabels[task.status] || statusLabels.pending;
    const priority = priorityLabels[task.priority] || priorityLabels.medium;
    const shiftLabel = task.shift ? getShiftLabel(
      task.shift,
      task.morningStartTime,
      task.morningEndTime,
      task.afternoonStartTime,
      task.afternoonEndTime
    ) : null;

    const checklistItems = task.checklistItems || [];
    const completedCount = checklistItems.filter((item: TaskChecklistItem) => item.isCompleted).length;
    const assignees = task.assignees?.map(a => a.user.name) || [];

    // Collect all equipment
    const allEquipment: string[] = [];
    equipmentByUser.forEach(user => {
      user.shifts.morning.forEach(eq => {
        if (!allEquipment.includes(eq.name)) allEquipment.push(eq.name);
      });
      user.shifts.afternoon.forEach(eq => {
        if (!allEquipment.includes(eq.name)) allEquipment.push(eq.name);
      });
    });

    return (
      <div
        ref={ref}
        style={{
          width: '600px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#CC0000',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            PULSO
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Sistema de Tareas
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Title */}
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px',
              lineHeight: 1.3,
            }}
          >
            {task.title}
          </h1>
          <div
            style={{
              height: '3px',
              backgroundColor: '#CC0000',
              width: '80px',
              marginBottom: '20px',
            }}
          />

          {/* Status and Priority Row */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Estado:</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {status.emoji} {status.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>Prioridad:</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: priority.color,
                }}
              >
                {priority.label}
              </span>
            </div>
          </div>

          {/* Dates Section */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>
                📅 <strong>Fecha límite:</strong> {formatDateLong(task.dueDate)}
              </span>
            </div>
            {task.executionDate && (
              <div style={{ marginBottom: shiftLabel ? '8px' : 0 }}>
                <span style={{ fontSize: '14px' }}>
                  📅 <strong>Fecha ejecución:</strong> {formatDateLong(task.executionDate)}
                </span>
              </div>
            )}
            {shiftLabel && (
              <div>
                <span style={{ fontSize: '14px' }}>
                  🕐 <strong>Horario:</strong> {shiftLabel}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                📝 Descripción:
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#4B5563',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {task.description}
              </p>
            </div>
          )}

          {/* Client Requirements */}
          {task.clientRequirements && (
            <div
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#92400E',
                  marginBottom: '8px',
                }}
              >
                📋 Requisitos del cliente:
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#78350F',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {task.clientRequirements}
              </p>
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                👥 Asignados:
              </div>
              <div style={{ paddingLeft: '8px' }}>
                {assignees.map((name, i) => (
                  <div key={i} style={{ fontSize: '14px', color: '#4B5563', marginBottom: '4px' }}>
                    • {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {allEquipment.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                📷 Equipo asignado:
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#4B5563',
                  paddingLeft: '8px',
                }}
              >
                • {allEquipment.join(' • ')}
              </div>
            </div>
          )}

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                ✅ Checklist ({completedCount}/{checklistItems.length}):
              </div>
              <div style={{ paddingLeft: '8px' }}>
                {checklistItems.map((item: TaskChecklistItem) => (
                  <div
                    key={item.id}
                    style={{
                      fontSize: '14px',
                      color: item.isCompleted ? '#059669' : '#4B5563',
                      marginBottom: '4px',
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {item.isCompleted ? '☑' : '☐'} {item.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            padding: '12px 24px',
            backgroundColor: '#F9FAFB',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            Generado el {formatCurrentDateTime()}
          </span>
        </div>
      </div>
    );
  }
);

TaskExportView.displayName = 'TaskExportView';
