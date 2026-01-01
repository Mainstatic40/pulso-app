import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ProfileImageUpload } from '../users/ProfileImageUpload';

export function Header() {
  const { user, logout, updateUser } = useAuth();

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      becario: 'Becario',
    };
    return roles[role] || role;
  };

  return (
    <header className="fixed left-60 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          {/* Breadcrumb or page title could go here */}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {user && (
              <ProfileImageUpload user={user} onUpdate={updateUser} />
            )}
            <div className="hidden sm:block">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{getRoleName(user?.role || '')}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
