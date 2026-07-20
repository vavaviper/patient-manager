'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  isSameDay,
  parseISO,
  addMinutes,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { appointmentsApi, dentistsApi } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('week');
  const queryClient = useQueryClient();

  const range = useMemo(() => {
    if (view === 'day') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (view === 'month') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
    return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
  }, [currentDate, view]);

  const { data: appointmentsData } = useQuery({
    queryKey: ['calendar-appointments', range.start.toISOString(), range.end.toISOString()],
    queryFn: () =>
      appointmentsApi.list({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        limit: '200',
      }),
  });

  const updateAppointment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      toast.success('Appointment updated');
    },
    onError: () => toast.error('Cannot move appointment — conflict detected'),
  });

  const appointments = appointmentsData?.data ?? [];
  const days = view === 'day'
    ? [currentDate]
    : view === 'week'
      ? eachDayOfInterval({ start: range.start, end: range.end })
      : eachDayOfInterval({ start: range.start, end: range.end }).filter((_, i) => i % 7 === 0 || true).slice(0, 7);

  const weekDays = view === 'month'
    ? eachDayOfInterval({ start: startOfWeek(range.start), end: endOfWeek(range.end) })
    : days;

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.appointmentDate), day));

  const handlePrint = () => window.print();

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Calendar</h1>
          <p className="text-muted-foreground">{format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint} aria-label="Print schedule">
            <Printer className="h-4 w-4" />
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {weekDays.map((day) => {
            const dayAppts = getAppointmentsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  'rounded-lg border-0 shadow-sm min-h-[100px]',
                  !isCurrentMonth && 'opacity-40',
                  isSameDay(day, new Date()) && 'ring-2 ring-blue-500',
                )}
              >
                <CardContent className="p-2">
                  <p className="text-xs font-medium mb-1">{format(day, 'd')}</p>
                  {dayAppts.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded px-1 py-0.5 mb-0.5 truncate">
                      {format(parseISO(a.appointmentDate), 'h:mm a')} {a.patient?.lastName}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{dayAppts.length - 3} more</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-card overflow-auto shadow-sm">
          <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
            <div className="border-b border-r p-2" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-b p-2 text-center text-sm font-medium',
                  isSameDay(day, new Date()) && 'bg-blue-50 dark:bg-blue-950/30',
                )}
              >
                <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                <p>{format(day, 'd')}</p>
              </div>
            ))}
            {HOURS.map((hour) => (
              <>
                <div key={`hour-${hour}`} className="border-r p-2 text-xs text-muted-foreground text-right">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
                {days.map((day) => {
                  const slotAppts = getAppointmentsForDay(day).filter((a) => {
                    const aptHour = parseISO(a.appointmentDate).getHours();
                    return aptHour === hour;
                  });
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-b border-r min-h-[60px] p-1 relative"
                    >
                      {slotAppts.map((apt) => (
                        <AppointmentBlock
                          key={apt.id}
                          appointment={apt}
                          onResize={(duration) =>
                            updateAppointment.mutate({ id: apt.id, data: { duration } })
                          }
                          onMove={(newDate) =>
                            updateAppointment.mutate({
                              id: apt.id,
                              data: { appointmentDate: newDate.toISOString() },
                            })
                          }
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentBlock({
  appointment,
  onResize,
  onMove,
}: {
  appointment: Appointment;
  onResize: (duration: number) => void;
  onMove: (date: Date) => void;
}) {
  const height = Math.max((appointment.duration / 60) * 60, 24);

  return (
    <div
      className="absolute left-1 right-1 rounded-md bg-blue-500 text-white text-[10px] p-1 cursor-pointer hover:bg-blue-600 transition-colors overflow-hidden z-10"
      style={{ height: `${height}px`, top: '2px' }}
      title={`${appointment.patient?.firstName} ${appointment.patient?.lastName} — ${formatDateTime(appointment.appointmentDate)}`}
      draggable
      onDragEnd={(e) => {
        // Basic drag support — in production would calculate drop target
      }}
    >
      <p className="font-medium truncate">
        {appointment.patient?.firstName} {appointment.patient?.lastName}
      </p>
      <p className="opacity-80 truncate">{appointment.dentist?.name}</p>
    </div>
  );
}
