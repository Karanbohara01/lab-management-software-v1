import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const CONFIG: Record<Tone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-primary/30 bg-primary/5 text-foreground' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success/5 text-foreground' },
  warning: { icon: TriangleAlert, className: 'border-warning/30 bg-warning/5 text-foreground' },
  danger: { icon: AlertCircle, className: 'border-danger/30 bg-danger/5 text-foreground' },
};

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
}) {
  const { icon: Icon, className } = CONFIG[tone];
  return (
    <div role="alert" className={cn('flex gap-3 rounded-md border p-3 text-sm', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-muted-foreground')}>{children}</div>}
      </div>
    </div>
  );
}
