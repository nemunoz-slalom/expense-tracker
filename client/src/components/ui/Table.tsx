import { HTMLAttributes } from 'react';

export function Table(props: HTMLAttributes<HTMLTableElement>): JSX.Element {
  return <table {...props} />;
}
