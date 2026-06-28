import type { ReactNode } from 'react';

type OpsLoginShellProps = {
  children: ReactNode;
};

export function OpsLoginShell({ children }: OpsLoginShellProps) {
  return <div className="shell">{children}</div>;
}
