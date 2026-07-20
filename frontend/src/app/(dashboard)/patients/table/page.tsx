'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { patientsApi, dentistsApi } from '@/lib/services';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PatientAvatar } from '@/components/shared/patient-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate, downloadCsv } from '@/lib/utils';
import { PATIENT_STATUS_LABELS } from '@/constants';
import { toast } from 'sonner';

export default function PatientsTablePage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [recallDue, setRecallDue] = useState(false);
  const [inactive, setInactive] = useState(false);

  const params: Record<string, string | number> = { page, limit: 20, sort };
  if (search) params.search = search;
  if (status) params.status = status;
  if (dentistId) params.dentistId = dentistId;
  if (recallDue) params.recallDue = 'true';
  if (inactive) params.inactive = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['patients-table', params],
    queryFn: () => patientsApi.list(params),
  });

  const { data: dentists = [] } = useQuery({
    queryKey: ['dentists'],
    queryFn: dentistsApi.list,
  });

  const handleExport = async () => {
    try {
      const csv = await patientsApi.exportCsv(params as Record<string, string>);
      downloadCsv(csv, `patients-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">Patient Directory</h1>
          <p className="text-muted-foreground">Search and filter all patients</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PID, name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl"
            aria-label="Search patients"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' || !v ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PATIENT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dentistId} onValueChange={(v) => { setDentistId(v === 'all' || !v ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Dentist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dentists</SelectItem>
            {dentists.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v ?? 'newest')}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="lastAppointment">Last Appointment</SelectItem>
            <SelectItem value="upcomingRecall">Upcoming Recall</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={recallDue ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setRecallDue(!recallDue); setPage(1); }}
          className="rounded-xl"
        >
          Recall Due
        </Button>
        <Button
          variant={inactive ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setInactive(!inactive); setPage(1); }}
          className="rounded-xl"
        >
          Inactive
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : !data?.data.length ? (
        <EmptyState title="No patients found" description="Try adjusting your search or filters" />
      ) : (
        <>
          <div className="rounded-xl border bg-white dark:bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>PID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Next Recall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <PatientAvatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
                        <span className="font-medium hover:text-blue-600">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{patient.pid}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell><StatusBadge status={patient.status} /></TableCell>
                    <TableCell>{formatDate(patient.lastAppointment)}</TableCell>
                    <TableCell>{formatDate(patient.nextRecallDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.data.length} of {data.meta.total} patients
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
