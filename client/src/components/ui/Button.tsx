import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '../../lib/cn';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn('button', className)} {...props} />
  ),
);
Button.displayName = 'Button';
