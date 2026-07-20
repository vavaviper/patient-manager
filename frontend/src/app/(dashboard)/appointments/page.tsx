'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { appointmentsApi, patientsApi, dentistsApi, settingsApi } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { APPOINTMENT_DURATIONS } from '@/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const bookingSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  dentistId: z.string().min(1, 'Select a dentist'),
  operatoryId: z.string().optional(),
  appointmentDate: z.string().min(1, 'Select date and time'),
  duration: z.number().min(15),
  notes: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const preselectedPatient = searchParams.get('patient');
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ limit: 200 }),
  });

  const { data: dentists = [] } = useQuery({
    queryKey: ['dentists'],
    queryFn: dentistsApi.list,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientId: preselectedPatient ?? '',
      duration: 30,
    },
  });

  const dentistId = watch('dentistId');
  const operatoryId = watch('operatoryId');
  const duration = watch('duration');

  useEffect(() => {
    if (preselectedPatient) setValue('patientId', preselectedPatient);
  }, [preselectedPatient, setValue]);

  useEffect(() => {
    if (selectedDate && dentistId) {
      setLoadingSlots(true);
      appointmentsApi
        .availableSlots({
          dentistId,
          operatoryId: operatoryId ?? '',
          date: selectedDate.toISOString(),
          duration: String(duration),
        })
        .then(setAvailableSlots)
        .catch(() => setAvailableSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate, dentistId, operatoryId, duration]);

  const bookAppointment = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patients-kanban'] });
      toast.success('Appointment booked! Confirmation email sent.');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Booking failed'),
  });

  const onSubmit = (data: BookingForm) => {
    bookAppointment.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Book Appointment</h1>
        <p className="text-muted-foreground">Schedule a new patient appointment</p>
      </div>

      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={watch('patientId')} onValueChange={(v) => setValue('patientId', v ?? '')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientsData?.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.pid} — {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && <p className="text-sm text-destructive">{errors.patientId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dentist</Label>
                <Select value={watch('dentistId')} onValueChange={(v) => setValue('dentistId', v ?? '')}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dentistId && <p className="text-sm text-destructive">{errors.dentistId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Operatory</Label>
                <Select value={watch('operatoryId') ?? ''} onValueChange={(v) => setValue('operatoryId', v ?? '')}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings?.operatories?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name} — {o.chair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start rounded-xl', !selectedDate && 'text-muted-foreground')}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setValue('duration', parseInt(v ?? '30'))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDate && dentistId && (
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available slots for this date</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={watch('appointmentDate') === slot ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setValue('appointmentDate', slot)}
                      >
                        {format(parseISO(slot), 'h:mm a')}
                      </Button>
                    ))}
                  </div>
                )}
                {errors.appointmentDate && <p className="text-sm text-destructive">{errors.appointmentDate.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} placeholder="Optional notes..." className="rounded-xl" />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8]"
              disabled={bookAppointment.isPending}
            >
              {bookAppointment.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
