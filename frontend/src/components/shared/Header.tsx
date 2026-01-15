import { useState, useEffect } from 'react';
import { LogOut, Search, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ProfileImageUpload } from '../users/ProfileImageUpload';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, updateUser } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      becario: 'Becario',
    };
    return roles[role] || role;
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white lg:left-60">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Lado izquierdo: Hamburger menu + Search */}
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa - solo móvil */}
            <button
              onClick={onMenuClick}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-100"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="ml-2 hidden rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500 sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Lado derecho: Notificaciones + Usuario + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Info */}
            <div className="flex items-center gap-2 text-sm">
              {user && (
                <ProfileImageUpload user={user} onUpdate={updateUser} />
              )}
              <div className="hidden md:block">
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

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
