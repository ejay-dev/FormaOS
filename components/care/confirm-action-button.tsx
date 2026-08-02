'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmActionButtonProps {
  /** Server action the confirmed form posts to. */
  action: (formData: FormData) => Promise<void> | Promise<unknown>;
  /** Hidden inputs carried into the action (record ids, target status). */
  fields?: Record<string, string>;
  label: string;
  ariaLabel?: string;
  className?: string;
  testId?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'destructive' | 'primary';
}

export function ConfirmActionButton({
  action,
  fields,
  label,
  ariaLabel,
  className,
  testId,
  icon,
  title,
  description,
  confirmLabel,
  tone = 'destructive',
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={className}
          aria-label={ariaLabel}
          data-testid={testId}
        >
          {icon}
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action as (formData: FormData) => void}>
          {Object.entries(fields ?? {}).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <ConfirmSubmit label={confirmLabel} tone={tone} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmSubmit({
  label,
  tone,
}: {
  label: string;
  tone: 'destructive' | 'primary';
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        tone === 'destructive'
          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? 'Working…' : label}
    </button>
  );
}
