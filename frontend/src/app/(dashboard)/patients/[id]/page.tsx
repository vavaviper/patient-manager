'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { patientsApi } from '@/lib/services';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageHeaderSkeleton, TableSkeleton } from '@/components/shared/loading-skeleton';
import { formatDate, formatDateTime, getAge } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isReceptionist, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState('');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['patient-timeline', id],
    queryFn: () => patientsApi.timeline(id),
  });

  const addNote = useMutation({
    mutationFn: (content: string) => patientsApi.addNote(id, content),
    onSuccess: () => {
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success('Note added');
    },
  });

  if (isLoading) return <PageHeaderSkeleton />;
  if (!patient) return <p>Patient not found</p>;

  const canEdit = isAdmin || isReceptionist;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/patients"
          aria-label="Back to patients"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PatientAvatar firstName={patient.firstName} lastName={patient.lastName} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">
              {patient.firstName} {patient.lastName}
            </h1>
            <StatusBadge status={patient.status} />
          </div>
          <p className="text-muted-foreground">{patient.pid} · Age {getAge(patient.birthDate)}</p>
        </div>
        {canEdit && (
          <Link href={`/appointments?patient=${patient.id}`} className={buttonVariants({ className: 'rounded-xl' })}>
            Book Appointment
          </Link>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notes">Medical Notes</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{patient.phone}</div>
                {patient.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{patient.email}</div>}
                {patient.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{patient.address}</div>}
                {patient.emergencyContact && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Emergency Contact</p>
                    <p>{patient.emergencyContact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Recall & Status</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Current Status</span><StatusBadge status={patient.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last Appointment</span><span>{formatDate(patient.lastAppointment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Next Recall</span><span className="font-medium">{formatDate(patient.nextRecallDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Patient Since</span><span>{formatDate(patient.createdAt)}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="pt-6">
              {!patient.appointments?.length ? (
                <p className="text-muted-foreground text-center py-8">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{formatDateTime(apt.appointmentDate)}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.dentist?.name} · {apt.duration} min · {apt.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              {canEdit && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a medical note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => addNote.mutate(noteContent)}
                    disabled={!noteContent.trim() || addNote.isPending}
                    className="rounded-xl"
                  >
                    Add Note
                  </Button>
                </div>
              )}
              <div className="space-y-3">
                {patient.medicalNotes?.map((note) => (
                  <div key={note.id} className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDateTime(note.createdAt)}</p>
                  </div>
                ))}
                {!patient.medicalNotes?.length && (
                  <p className="text-muted-foreground text-center py-4">No medical notes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{patient.insuranceProvider ?? 'Not on file'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Policy Number</p>
                    <p className="font-medium">{patient.insuranceNumber ?? 'Not on file'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</p>
                        {log.details && <p className="text-sm text-muted-foreground">{log.details}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
