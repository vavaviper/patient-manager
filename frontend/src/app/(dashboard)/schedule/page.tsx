'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { formatDateTime } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';

export default function TodaySchedulePage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: appointmentsApi.today,
  });

  if (isLoading) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Today&apos;s Schedule</h1>
        <p className="text-muted-foreground">Your appointments for today</p>
      </div>

      {!appointments.length ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No appointments today"
          description="You have a clear schedule for today"
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="rounded-xl border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-center min-w-[80px]">
                  <p className="text-lg font-bold text-blue-600">
                    {formatDateTime(apt.appointmentDate).split(' ').slice(-2).join(' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                </div>
                {apt.patient && (
                  <PatientAvatar
                    firstName={apt.patient.firstName}
                    lastName={apt.patient.lastName}
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {apt.patient?.firstName} {apt.patient?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{apt.patient?.pid}</p>
                  {apt.notes && <p className="text-sm mt-1">{apt.notes}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{apt.operatory?.name}</p>
                  <p className="text-muted-foreground capitalize">{apt.status.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
