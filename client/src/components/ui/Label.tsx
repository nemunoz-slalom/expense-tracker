import { LabelHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>): JSX.Element {
  return <label className={cn('label', className)} {...props} />;
}
