'use client';

import { useEffect, useRef } from 'react';

const INSTALL_BANNER_DISMISS_STORAGE_KEY = 'shoreline_ops_install_banner_dismissed_v1';
const INSTALL_BANNER_DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

function isIosDevice() {
  return /iPad|iPhone|iPod/i.test(window.navigator.userAgent || '');
}

function isStandaloneMode() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isNativeOpsApp() {
  return /ShorelineOpsNative/i.test(window.navigator.userAgent || '');
}

function shouldShowInstallBanner() {
  try {
    const saved = Number(window.localStorage.getItem(INSTALL_BANNER_DISMISS_STORAGE_KEY) || 0);
    if (saved && Number.isFinite(saved) && Date.now() - saved < INSTALL_BANNER_DISMISS_TTL_MS) return false;
  } catch (error) {
    console.warn('Could not read install banner dismissal:', error);
  }
  return true;
}

function dismissInstallBanner() {
  try {
    window.localStorage.setItem(INSTALL_BANNER_DISMISS_STORAGE_KEY, String(Date.now()));
  } catch (error) {
    console.warn('Could not persist install banner dismissal:', error);
  }
  document.body.dataset.iosInstall = 'dismissed';
}

function createOpsUrl(path: string) {
  return `${window.location.protocol}//${window.location.host}/${path}`;
}

function createOpsLoginController(signal: AbortSignal) {
  const form = byId<HTMLFormElement>('login-form');
  const status = byId('status');
  const submit = byId<HTMLButtonElement>('submit-btn');
  const username = byId<HTMLInputElement>('username');
  const password = byId<HTMLInputElement>('password');
  const opsAppUrl = createOpsUrl('ops');
  const opsLoginUrl = createOpsUrl('ops-login');

  if (window.location.protocol === 'file:') {
    window.location.replace(opsLoginUrl);
    return;
  }

  const setStatus = (message: string, type = '') => {
    if (!status) return;
    status.textContent = message;
    status.className = `status${type ? ` ${type}` : ''}`;
  };
  const setBusy = (isBusy: boolean) => {
    if (submit) submit.disabled = isBusy;
  };

  if (isNativeOpsApp()) {
    document.body.dataset.nativeApp = 'true';
    const supportCopy = byId('support-copy');
    if (supportCopy) supportCopy.textContent = 'If the private CRM is unavailable, contact Shoreline support or your site administrator.';
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => {});
    }
  }

  if (isIosDevice() && !isStandaloneMode() && !isNativeOpsApp() && shouldShowInstallBanner()) {
    document.body.dataset.iosInstall = 'needed';
  }

  document.querySelector('.install-banner-close')?.addEventListener('click', dismissInstallBanner, { signal });

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal
      });
      if (!response.ok) {
        setStatus('This sign-in page becomes active after the private Cloudflare ops service is available.', 'error');
        if (submit) submit.disabled = true;
        return;
      }
      const data = await response.json();
      if (data.authenticated) {
        window.location.replace(opsAppUrl);
        return;
      }
      setStatus('Private service ready. Sign in with your Shoreline ops login.', 'success');
    } catch {
      setStatus('Could not reach the private ops service yet. Verify the local dev server, Cloudflare preview, and required environment bindings.', 'error');
      if (submit) submit.disabled = true;
    }
  };

  const submitLogin = async () => {
    setBusy(true);
    setStatus('Signing in...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username?.value || '', password: password?.value || '' }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Sign-in failed');
      setStatus('Access granted. Opening Shoreline ops...', 'success');
      window.location.replace(opsAppUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Sign-in failed', 'error');
      setBusy(false);
      if (password?.value) password.select();
    }
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitLogin();
  }, { signal });

  if ('serviceWorker' in navigator && !isNativeOpsApp()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/ops-sw.js').catch((error) => {
        console.error('Ops service worker registration failed:', error);
      });
    }, { signal });
  }

  void checkSession();
}

export function OpsLoginClientBehavior() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();
    createOpsLoginController(controller.signal);
    return () => controller.abort();
  }, []);

  return null;
}
