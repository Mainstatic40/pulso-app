import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import type { WeeklyLogWithUser } from '../../services/weekly-log.service';

const weeklyLogSchema = z.object({
  activities: z.string().min(1, 'Las actividades son requeridas').max(5000, 'Máximo 5000 caracteres'),
  achievements: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  challenges: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  learnings: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  nextGoals: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
});

type WeeklyLogFormData = z.infer<typeof weeklyLogSchema>;

interface WeeklyLogFormProps {
  existingLog?: WeeklyLogWithUser | null;
  onSubmit: (data: WeeklyLogFormData) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export function WeeklyLogForm({
  existingLog,
  onSubmit,
  isLoading,
  isReadOnly,
}: WeeklyLogFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WeeklyLogFormData>({
    resolver: zodResolver(weeklyLogSchema),
    defaultValues: {
      activities: existingLog?.activities || '',
      achievements: existingLog?.achievements || '',
      challenges: existingLog?.challenges || '',
      learnings: existingLog?.learnings || '',
      nextGoals: existingLog?.nextGoals || '',
    },
  });

  const handleFormSubmit = (data: WeeklyLogFormData) => {
    onSubmit({
      ...data,
      achievements: data.achievements || undefined,
      challenges: data.challenges || undefined,
      learnings: data.learnings || undefined,
      nextGoals: data.nextGoals || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingLog ? 'Editar Bitácora' : 'Nueva Bitácora'}
          {isReadOnly && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Solo lectura)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Textarea
            label="Actividades realizadas *"
            placeholder="Describe las actividades que realizaste esta semana..."
            rows={4}
            error={errors.activities?.message}
            disabled={isReadOnly}
            {...register('activities')}
          />

          <Textarea
            label="Logros destacados"
            placeholder="¿Qué logros importantes tuviste esta semana?"
            rows={3}
            error={errors.achievements?.message}
            disabled={isReadOnly}
            {...register('achievements')}
          />

          <Textarea
            label="Dificultades encontradas"
            placeholder="¿Qué obstáculos o dificultades enfrentaste?"
            rows={3}
            error={errors.challenges?.message}
            disabled={isReadOnly}
            {...register('challenges')}
          />

          <Textarea
            label="Aprendizajes"
            placeholder="¿Qué aprendiste esta semana?"
            rows={3}
            error={errors.learnings?.message}
            disabled={isReadOnly}
            {...register('learnings')}
          />

          <Textarea
            label="Objetivos para la próxima semana"
            placeholder="¿Qué planeas lograr la próxima semana?"
            rows={3}
            error={errors.nextGoals?.message}
            disabled={isReadOnly}
            {...register('nextGoals')}
          />

          {!isReadOnly && (
            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading} disabled={!isDirty && !!existingLog}>
                <Save className="mr-2 h-4 w-4" />
                {existingLog ? 'Guardar Cambios' : 'Crear Bitácora'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
