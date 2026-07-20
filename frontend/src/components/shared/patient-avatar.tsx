'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PatientAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function PatientAvatar({
  firstName,
  lastName,
  size = 'md',
  className,
}: PatientAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-gradient-to-br from-sky-100 to-blue-200 text-navy-700 font-semibold dark:from-sky-900 dark:to-blue-900 dark:text-sky-200">
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
