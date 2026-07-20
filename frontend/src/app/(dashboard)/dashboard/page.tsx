'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi, activityApi } from '@/lib/services';
import { CardSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeleton';
import { formatDateTime } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';

const statCards = [
  { key: 'todayAppointments', label: "Today's Appointments", icon: Calendar, color: 'text-blue-600 bg-blue-50', prefix: undefined as string | undefined },
  { key: 'recallDue', label: 'Recall Due', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', prefix: undefined },
  { key: 'inactivePatients', label: 'Inactive Patients', icon: Users, color: 'text-slate-600 bg-slate-50', prefix: undefined },
  { key: 'weekAppointments', label: 'This Week', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', prefix: undefined },
  { key: 'newPatients', label: 'New This Month', icon: UserPlus, color: 'text-violet-600 bg-violet-50', prefix: undefined },
  { key: 'revenuePlaceholder', label: 'Revenue (MTD)', icon: DollarSign, color: 'text-teal-600 bg-teal-50', prefix: '$' },
] as const;

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: dashboardApi.charts,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => activityApi.feed(10),
  });

  if (statsLoading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your clinic&apos;s performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map(({ key, label, icon: Icon, color, prefix }) => (
            <Card key={key} className="rounded-xl shadow-sm border-0 bg-white dark:bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">
                      {prefix ?? ''}
                      {stats?.[key]?.toLocaleString() ?? '—'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Appointments per Month</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="h-64 animate-pulse bg-muted rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={charts?.appointmentsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Patient Growth</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="h-64 animate-pulse bg-muted rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={charts?.patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Recall Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[260px]">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-36 h-36 -rotate-90">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
                    <circle
                      cx="72" cy="72" r="60" fill="none" stroke="#2563eb" strokeWidth="12"
                      strokeDasharray={`${(charts?.recallCompletionRate ?? 0) * 3.77} 377`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{charts?.recallCompletionRate ?? 0}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Recall completion this period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Inactive Patients Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="h-64 animate-pulse bg-muted rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={charts?.inactiveOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                    {log.details && <p className="text-muted-foreground">{log.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
