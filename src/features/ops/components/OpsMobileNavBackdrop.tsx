'use client';

export function OpsMobileNavBackdrop() {
  const closeMobileNav = () => {
    document.body.classList.remove('sidebar-open');
  };

  return (
    <button className="mobile-nav-backdrop" id="mobile-nav-backdrop" onClick={closeMobileNav} aria-label="Close navigation" />
  );
}
