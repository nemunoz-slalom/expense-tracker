import { ReactNode } from 'react';

export function Tooltip({ children, content }: { children: ReactNode; content: string }): JSX.Element {
  return <span title={content}>{children}</span>;
}
