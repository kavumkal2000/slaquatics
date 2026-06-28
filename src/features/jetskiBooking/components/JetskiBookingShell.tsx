import type { ReactNode } from 'react';

type JetskiBookingShellProps = {
  children: ReactNode;
};

export function JetskiBookingShell({ children }: JetskiBookingShellProps) {
  return <div className="shell">{children}</div>;
}
