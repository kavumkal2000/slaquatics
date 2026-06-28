import type { ReactNode } from 'react';

type PrivacyPolicyShellProps = {
  children: ReactNode;
};

export function PrivacyPolicyShell({ children }: PrivacyPolicyShellProps) {
  return <div className="shell">{children}</div>;
}
