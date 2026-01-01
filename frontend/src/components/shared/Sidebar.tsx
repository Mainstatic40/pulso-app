import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Calendar,
  CalendarDays,
  BookOpen,
  Users,
  BarChart3,
  Camera,
  MessageCircle,
} from 'lucide-react';
import { useAuthContext } from '../../stores/auth.store.tsx';
import { cn } from '../../lib/utils';
import { conversationService } from '../../services/conversation.service';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/time-entries', icon: Clock, label: 'Registro de Horas', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/tasks', icon: CheckSquare, label: 'Tareas', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/events', icon: Calendar, label: 'Eventos', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/equipment', icon: Camera, label: 'Equipos', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/chat', icon: MessageCircle, label: 'Chat', roles: ['admin', 'supervisor', 'becario'], hasBadge: true },
  { to: '/weekly-log', icon: BookOpen, label: 'Bitacora Semanal', roles: ['admin', 'supervisor', 'becario'] },
  { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin', 'supervisor'] },
  { to: '/reports', icon: BarChart3, label: 'Reportes', roles: ['admin', 'supervisor'] },
];

export function Sidebar() {
  const { user } = useAuthContext();

  // Fetch unread message count with polling
  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: conversationService.getUnreadCount,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#CC0000]">PULSO</h1>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#CC0000] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            {item.hasBadge && unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
