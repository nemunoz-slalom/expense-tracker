import * as ProgressPrimitive from '@radix-ui/react-progress';

export function Progress({ value }: { value: number }): JSX.Element {
  return (
    <ProgressPrimitive.Root className="progress" value={value}>
      <ProgressPrimitive.Indicator className="progress-indicator" style={{ transform: `translateX(-${100 - value}%)` }} />
    </ProgressPrimitive.Root>
  );
}
