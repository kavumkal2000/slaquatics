'use client';

import { useEffect } from 'react';
import { mountOpsRuntime } from './runtime/opsRuntime';

export function OpsClientBehavior() {
  useEffect(() => {
    mountOpsRuntime();
  }, []);

  return null;
}
