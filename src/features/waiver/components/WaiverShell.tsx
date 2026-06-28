import type { ReactNode } from 'react';

type WaiverShellProps = {
  children: ReactNode;
};

export function WaiverShell({ children }: WaiverShellProps) {
  return <div className="shell">{children}</div>;
}
