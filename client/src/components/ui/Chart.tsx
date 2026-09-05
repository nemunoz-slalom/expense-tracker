import { ReactNode } from 'react';

export function Chart({ children }: { children: ReactNode }): JSX.Element {
  return <div role="img">{children}</div>;
}
