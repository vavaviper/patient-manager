'use client';

import { useQuery } from '@tanstack/react-query';
import { activityApi } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export default function ActivityPage() {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => activityApi.feed(100),
  });

  if (isLoading) return <TableSkeleton rows={10} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Activity Feed</h1>
        <p className="text-muted-foreground">Chronological log of clinic events</p>
      </div>

      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {activity.map((log, i) => (
              <div
                key={log.id}
                className="flex gap-4 py-4 border-b last:border-0"
              >
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  {i < activity.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                      )}
                      {log.patient && (
                        <p className="text-xs text-blue-600 mt-1">
                          {log.patient.pid} — {log.patient.firstName} {log.patient.lastName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  {log.user && (
                    <p className="text-xs text-muted-foreground mt-1">by {log.user.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
