import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const styles = {
    default: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    destructive: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  };

  const icons = {
    default: <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />,
    destructive: <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn('relative w-full rounded-lg border p-4 text-sm flex items-start gap-3', styles[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  );
}
