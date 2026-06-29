'use client';

const INSTALL_BANNER_DISMISS_STORAGE_KEY = 'shoreline_ops_install_banner_dismissed_v1';

export function OpsDiv1() {
  const dismissInstallBanner = () => {
    try {
      window.localStorage.setItem(INSTALL_BANNER_DISMISS_STORAGE_KEY, String(Date.now()));
    } catch (error) {
      console.warn('Could not persist install banner dismissal:', error);
    }
    document.body.dataset.iosInstall = 'dismissed';
  };

  return (
    <div className="install-banner">
  <div className="install-banner-copy">
    <strong>Use the Home Screen App</strong>
    <p>For the clean iPhone app view, open Shoreline Ops from your home screen instead of a Safari tab.</p>
  </div>
  <button className="install-banner-close" type="button" aria-label="Dismiss install reminder" onClick={dismissInstallBanner}>×</button>
</div>
  );
}
