import { PATIENT_STATUS_LABELS, PATIENT_STATUS_COLORS } from '@/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        PATIENT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700',
        className,
      )}
      aria-label={`Status: ${PATIENT_STATUS_LABELS[status] ?? status}`}
    >
      {PATIENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
