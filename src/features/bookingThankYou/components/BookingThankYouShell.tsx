import type { ReactNode } from 'react';

type BookingThankYouShellProps = {
  children: ReactNode;
};

export function BookingThankYouShell({ children }: BookingThankYouShellProps) {
  return <div className="shell">{children}</div>;
}
