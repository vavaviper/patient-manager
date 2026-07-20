'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsApi } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeaderSkeleton } from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const { register, handleSubmit, reset } = useForm({
    values: settings,
  });

  const updateSettings = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
  });

  if (isLoading) return <PageHeaderSkeleton />;

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Settings</h1>
        <p className="text-muted-foreground">Manage clinic configuration</p>
      </div>

      <Tabs defaultValue="clinic">
        <TabsList className="rounded-xl">
          <TabsTrigger value="clinic">Clinic Info</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="team">Dentists & Operatories</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit((data) => updateSettings.mutate(data))}>
          <TabsContent value="clinic" className="mt-4">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Clinic Information</CardTitle>
                <CardDescription>Basic details about your practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input {...register('clinicName')} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...register('address')} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input {...register('phone')} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input {...register('email')} type="email" className="rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders" className="mt-4">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Reminder Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Reminder Hours Before Appointment</Label>
                  <Input {...register('reminderHoursBefore', { valueAsNumber: true })} type="number" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Recall Interval (months)</Label>
                  <Input {...register('recallIntervalMonths', { valueAsNumber: true })} type="number" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Inactive After (years)</Label>
                  <Input {...register('inactiveYears', { valueAsNumber: true })} type="number" className="rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-4 space-y-4">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Dentists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {settings?.dentists?.map((d) => (
                    <div key={d.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">{d.specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Operatories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {settings?.operatories?.map((o) => (
                    <div key={o.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{o.name}</p>
                        <p className="text-sm text-muted-foreground">{o.chair}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-4">
            <Button type="submit" className="rounded-xl" disabled={updateSettings.isPending}>
              Save Settings
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
