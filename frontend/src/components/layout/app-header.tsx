'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Moon, Sun, LogOut, Command } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { searchApi, notificationsApi } from '@/lib/services';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchApi.global(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <Button
        variant="outline"
        className="relative w-full max-w-md justify-start text-muted-foreground"
        onClick={() => setSearchOpen(true)}
        aria-label="Open global search"
      >
        <Search className="mr-2 h-4 w-4" />
        Search patients, appointments...
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" size="icon" aria-label="Notifications" />}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'border-b p-3 text-sm last:border-0',
                      !n.read && 'bg-blue-50/50 dark:bg-blue-950/20',
                    )}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search patients, appointments, dentists..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults?.patients && searchResults.patients.length > 0 && (
            <CommandGroup heading="Patients">
              {searchResults.patients.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    router.push(`/patients/${p.id}`);
                    setSearchOpen(false);
                  }}
                >
                  {p.pid} — {p.firstName} {p.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchResults?.appointments && searchResults.appointments.length > 0 && (
            <CommandGroup heading="Appointments">
              {searchResults.appointments.map((a) => (
                <CommandItem
                  key={a.id}
                  onSelect={() => {
                    router.push('/calendar');
                    setSearchOpen(false);
                  }}
                >
                  {a.patient?.firstName} {a.patient?.lastName} —{' '}
                  {formatDateTime(a.appointmentDate)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchResults?.dentists && searchResults.dentists.length > 0 && (
            <CommandGroup heading="Dentists">
              {searchResults.dentists.map((d) => (
                <CommandItem key={d.id}>{d.name} — {d.specialty}</CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
