import type { ReactNode } from 'react';

type JetskiBookingConfirmationShellProps = {
  children: ReactNode;
};

export function JetskiBookingConfirmationShell({ children }: JetskiBookingConfirmationShellProps) {
  return <div className="shell">{children}</div>;
}
