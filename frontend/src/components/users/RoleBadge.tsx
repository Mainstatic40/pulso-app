import { cn } from '../../utils/cn';

type UserRole = 'admin' | 'supervisor' | 'becario';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: 'Administrador',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  supervisor: {
    label: 'Supervisor',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  becario: {
    label: 'Becario',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
