import { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>): JSX.Element {
  return <section className={cn('card', className)} {...props} />;
}
