'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Table,
  Calendar,
  CalendarDays,
  Clock,
  Activity,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { NAV_ITEMS } from '@/constants';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Table,
  Calendar,
  CalendarDays,
  Clock,
  Activity,
  Settings,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-[#1e3a5f] dark:text-white">DentalFlow</p>
          <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
            Practice Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4" role="navigation">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Signed in as{' '}
          <span className="font-medium text-foreground">{user?.name}</span>
        </p>
        <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
      </div>
    </aside>
  );
}
