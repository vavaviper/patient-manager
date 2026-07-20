'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import Link from 'next/link';
import { Phone, Calendar, GripVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { patientsApi } from '@/lib/services';
import { PATIENT_STATUS_LABELS, KANBAN_COLUMNS } from '@/constants';
import type { Patient, PatientStatus } from '@/types';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { KanbanSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';

function PatientCard({ patient, isDragging }: { patient: Patient; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: patient.id, data: { patient, status: patient.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border bg-white dark:bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg rotate-1',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground touch-none"
          aria-label="Drag to change status"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <PatientAvatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
        <div className="flex-1 min-w-0">
          <Link href={`/patients/${patient.id}`} className="font-semibold text-sm hover:text-blue-600 truncate block">
            {patient.firstName} {patient.lastName}
          </Link>
          <p className="text-xs text-muted-foreground">{patient.pid}</p>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          Last: {formatDate(patient.lastAppointment)}
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          Recall: {formatDate(patient.nextRecallDate)}
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          {patient.phone}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href={`/patients/${patient.id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-7 text-xs flex-1' })}>
          View
        </Link>
        <Link href={`/appointments?patient=${patient.id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-7 text-xs flex-1' })}>
          Book
        </Link>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  patients,
}: {
  status: PatientStatus;
  patients: Patient[];
}) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm text-[#1e3a5f] dark:text-white">
          {PATIENT_STATUS_LABELS[status]}
        </h3>
        <span className="text-xs bg-muted rounded-full px-2 py-0.5 font-medium">
          {patients.length}
        </span>
      </div>
      <SortableContext items={patients.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[200px] rounded-xl bg-muted/30 p-2">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
          {patients.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
              Drop patients here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PatientsKanbanPage() {
  const queryClient = useQueryClient();
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  const { data: columns, isLoading } = useQuery({
    queryKey: ['patients-kanban'],
    queryFn: patientsApi.kanban,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PatientStatus }) =>
      patientsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['patients-kanban'] });
      const previous = queryClient.getQueryData(['patients-kanban']);
      queryClient.setQueryData(['patients-kanban'], (old: typeof columns) => {
        if (!old) return old;
        let movedPatient: Patient | undefined;
        const updated = old.map((col) => ({
          ...col,
          patients: col.patients.filter((p) => {
            if (p.id === id) {
              movedPatient = { ...p, status };
              return false;
            }
            return true;
          }),
        }));
        if (movedPatient) {
          return updated.map((col) =>
            col.status === status
              ? { ...col, patients: [movedPatient!, ...col.patients] }
              : col,
          );
        }
        return updated;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['patients-kanban'], context?.previous);
      toast.error('Failed to update patient status');
    },
    onSuccess: () => toast.success('Patient status updated'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['patients-kanban'] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const patient = columns
      ?.flatMap((c) => c.patients)
      .find((p) => p.id === event.active.id);
    if (patient) setActivePatient(patient);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePatient(null);
    const { active, over } = event;
    if (!over || !columns) return;

    const patientId = active.id as string;
    let targetStatus: PatientStatus | null = null;

    const overColumn = columns.find((col) =>
      col.patients.some((p) => p.id === over.id),
    );
    if (overColumn) {
      targetStatus = overColumn.status;
    } else {
      const col = columns.find((c) => c.status === over.id);
      if (col) targetStatus = col.status;
    }

    const currentPatient = columns.flatMap((c) => c.patients).find((p) => p.id === patientId);
    if (targetStatus && currentPatient && currentPatient.status !== targetStatus) {
      updateStatus.mutate({ id: patientId, status: targetStatus });
    }
  };

  if (isLoading) return <KanbanSkeleton />;

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Patient Board</h1>
            <p className="text-muted-foreground">Drag cards to update patient status</p>
          </div>
          <Link href="/appointments" className={buttonVariants({ className: 'rounded-xl' })}>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Link>
        </div>

        {!columns?.some((c) => c.patients.length > 0) ? (
          <EmptyState title="No patients yet" description="Add patients to see them on the board" />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {(columns ?? KANBAN_COLUMNS.map((status) => ({ status, patients: [] }))).map(
                (col) => (
                  <div key={col.status} id={col.status}>
                    <KanbanColumn status={col.status as PatientStatus} patients={col.patients} />
                  </div>
                ),
              )}
            </div>
            <DragOverlay>
              {activePatient ? <PatientCard patient={activePatient} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </ErrorBoundary>
  );
}
