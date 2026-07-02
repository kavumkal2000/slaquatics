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
  const clientLinkForm = byId<HTMLFormElement>('client-magic-link-form');
  const clientPasswordForm = byId<HTMLFormElement>('client-password-form');
  const status = byId('status');
  const submit = byId<HTMLButtonElement>('submit-btn');
  const clientLinkBtn = byId<HTMLButtonElement>('client-link-btn');
  const clientPasswordBtn = byId<HTMLButtonElement>('client-password-btn');
  const clientPasswordSkipBtn = byId<HTMLButtonElement>('client-password-skip-btn');
  const passkeyLoginBtn = byId<HTMLButtonElement>('passkey-login-btn');
  const passkeyRegisterBtn = byId<HTMLButtonElement>('passkey-register-btn');
  const username = byId<HTMLInputElement>('username');
  const password = byId<HTMLInputElement>('password');
  const clientEmail = byId<HTMLInputElement>('client-email');
  const clientPassword = byId<HTMLInputElement>('client-password');
  const turnstileSlot = byId('turnstile-slot');
  const opsAppUrl = createOpsUrl('ops');
  const opsLoginUrl = createOpsUrl('ops-login');
  let turnstileToken = '';
  let authConfig = {
    magicLinkConfigured: false,
    turnstileSiteKey: ''
  };

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
  const setClientBusy = (isBusy: boolean) => {
    if (clientLinkBtn) clientLinkBtn.disabled = isBusy;
  };
  const setClientPasswordBusy = (isBusy: boolean) => {
    if (clientPasswordBtn) clientPasswordBtn.disabled = isBusy;
    if (clientPasswordSkipBtn) clientPasswordSkipBtn.disabled = isBusy;
  };
  const setPasskeyBusy = (isBusy: boolean) => {
    if (passkeyLoginBtn) passkeyLoginBtn.disabled = isBusy;
    if (passkeyRegisterBtn) passkeyRegisterBtn.disabled = isBusy;
  };

  const resetTurnstile = () => {
    const turnstile = (window as any).turnstile;
    if (turnstile?.reset && turnstileSlot && turnstileSlot.dataset.widgetId) {
      turnstile.reset(turnstileSlot.dataset.widgetId);
      turnstileToken = '';
    }
  };

  const loadTurnstileScript = () => new Promise<void>((resolve, reject) => {
    if ((window as any).turnstile) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-loader="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true, signal });
      existing.addEventListener('error', () => reject(new Error('Security check could not load.')), { once: true, signal });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileLoader = 'true';
    script.addEventListener('load', () => resolve(), { once: true, signal });
    script.addEventListener('error', () => reject(new Error('Security check could not load.')), { once: true, signal });
    document.head.append(script);
  });

  const renderTurnstile = async () => {
    if (!authConfig.turnstileSiteKey || !turnstileSlot || turnstileSlot.dataset.widgetId) return;
    turnstileSlot.hidden = false;
    await loadTurnstileScript();
    const turnstile = (window as any).turnstile;
    if (!turnstile?.render) return;
    const widgetId = turnstile.render(turnstileSlot, {
      sitekey: authConfig.turnstileSiteKey,
      theme: 'dark',
      callback(token: string) {
        turnstileToken = token;
      },
      'expired-callback'() {
        turnstileToken = '';
      },
      'error-callback'() {
        turnstileToken = '';
      }
    });
    turnstileSlot.dataset.widgetId = String(widgetId);
  };

  const requireTurnstileToken = () => {
    if (!authConfig.turnstileSiteKey) return true;
    if (turnstileToken) return true;
    setStatus('Complete the security check before signing in.', 'error');
    return false;
  };

  const showClientPasswordPrompt = () => {
    if (form) form.hidden = true;
    if (clientLinkForm) clientLinkForm.hidden = true;
    if (passkeyLoginBtn) passkeyLoginBtn.hidden = true;
    if (clientPasswordForm) clientPasswordForm.hidden = false;
  };

  const finishClientLogin = () => {
    setStatus('Client sign-in complete.', 'success');
    window.location.replace(createOpsUrl(''));
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
        if (data.user?.role === 'client') {
          if (data.clientPassword?.shouldPrompt) {
            showClientPasswordPrompt();
            setStatus('You are signed in. Add an optional password or skip for now.', 'success');
            return;
          }
          finishClientLogin();
          return;
        }
        window.location.replace(opsAppUrl);
        return;
      }
      authConfig = {
        magicLinkConfigured: Boolean(data.auth?.magicLinkConfigured),
        turnstileSiteKey: String(data.auth?.turnstileSiteKey || '')
      };
      await renderTurnstile().catch((error) => {
        console.error(error);
        setStatus('Security check could not load. Try again shortly.', 'error');
      });
      setStatus('Private service ready. Sign in with your Shoreline ops login.', 'success');
    } catch {
      setStatus('Could not reach the private ops service yet. Verify the local dev server, Cloudflare preview, and required environment bindings.', 'error');
      if (submit) submit.disabled = true;
    }
  };

  const submitLogin = async () => {
    if (!requireTurnstileToken()) return;
    setBusy(true);
    setStatus('Signing in...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username?.value || '', password: password?.value || '', turnstileToken }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Sign-in failed');
      if (data.user?.role === 'client') {
        if (data.clientPassword?.shouldPrompt) {
          showClientPasswordPrompt();
          setStatus('You are signed in. Add an optional password or skip for now.', 'success');
          setBusy(false);
          return;
        }
        finishClientLogin();
        return;
      }
      if (data.passkey?.shouldPrompt && passkeyRegisterBtn) {
        passkeyRegisterBtn.hidden = false;
        setStatus('Password accepted. Set up a passkey to secure this owner account.', 'success');
        setBusy(false);
        return;
      }
      setStatus('Access granted. Opening Shoreline ops...', 'success');
      window.location.replace(opsAppUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Sign-in failed', 'error');
      resetTurnstile();
      setBusy(false);
      if (password?.value) password.select();
    }
  };

  const registerPasskey = async () => {
    setPasskeyBusy(true);
    setStatus('Opening passkey setup...');
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      const optionsResponse = await fetch('/api/auth/passkey/register/options', { credentials: 'same-origin', signal });
      const optionsPayload = await optionsResponse.json().catch(() => ({}));
      if (!optionsResponse.ok) throw new Error(optionsPayload.error || 'Could not start passkey setup.');
      const credential = await startRegistration({ optionsJSON: optionsPayload.options });
      const response = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not verify the passkey.');
      setStatus('Passkey secured. Opening Shoreline ops...', 'success');
      window.location.replace(opsAppUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Passkey setup failed', 'error');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const loginWithPasskey = async () => {
    setPasskeyBusy(true);
    setStatus('Opening passkey sign-in...');
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const optionsResponse = await fetch('/api/auth/passkey/login/options', { credentials: 'same-origin', signal });
      const optionsPayload = await optionsResponse.json().catch(() => ({}));
      if (!optionsResponse.ok) throw new Error(optionsPayload.error || 'Could not start passkey sign-in.');
      const credential = await startAuthentication({ optionsJSON: optionsPayload.options });
      const response = await fetch('/api/auth/passkey/login/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Passkey sign-in failed.');
      setStatus('Access granted. Opening Shoreline ops...', 'success');
      window.location.replace(opsAppUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Passkey sign-in failed', 'error');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const sendClientMagicLink = async () => {
    if (!requireTurnstileToken()) return;
    setClientBusy(true);
    setStatus('Sending secure sign-in link...');
    try {
      const response = await fetch('/api/auth/client/magic-link', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clientEmail?.value || '', turnstileToken }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the sign-in link.');
      setStatus('Check your email for a secure sign-in link.', 'success');
      if (clientEmail) clientEmail.value = '';
      resetTurnstile();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send the sign-in link.', 'error');
      resetTurnstile();
    } finally {
      setClientBusy(false);
    }
  };

  const saveClientPassword = async () => {
    setClientPasswordBusy(true);
    setStatus('Saving optional password...');
    try {
      const response = await fetch('/api/auth/client/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clientPassword?.value || '' }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save password.');
      finishClientLogin();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save password.', 'error');
      setClientPasswordBusy(false);
      if (clientPassword?.value) clientPassword.select();
    }
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitLogin();
  }, { signal });
  clientLinkForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void sendClientMagicLink();
  }, { signal });
  clientPasswordForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void saveClientPassword();
  }, { signal });
  clientPasswordSkipBtn?.addEventListener('click', () => {
    finishClientLogin();
  }, { signal });
  passkeyRegisterBtn?.addEventListener('click', () => { void registerPasskey(); }, { signal });
  passkeyLoginBtn?.addEventListener('click', () => { void loginWithPasskey(); }, { signal });

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
