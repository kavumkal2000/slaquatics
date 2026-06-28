'use client';

export function OpsLoginInstallBanner() {
  return (
    <div className="install-banner">
      <div className="install-banner-copy">
        <strong>Install Shoreline Ops</strong>
        <p>Open this from your iPhone home screen for the full app experience. In Safari, tap Share, then Add to Home Screen.</p>
      </div>
      <button className="install-banner-close" type="button" aria-label="Dismiss install reminder">×</button>
    </div>
  );
}
