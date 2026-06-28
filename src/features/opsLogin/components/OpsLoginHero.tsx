export function OpsLoginHero() {
  return (
    <section className="hero">
      <div>
        <div className="brand">Shoreline Ops</div>
        <div className="eyeline">Private operations access</div>
        <h1>Secure bookings, customers, and fleet control.</h1>
        <p>This private ops app keeps Shoreline customer records, bookings, notes, imports, and maintenance data behind a password-protected server session instead of browser-only storage.</p>
      </div>
      <div className="stats">
        <div className="stat"><div className="value">CRM</div><div className="label">Shared server data</div></div>
        <div className="stat"><div className="value">Auth</div><div className="label">Password protected</div></div>
        <div className="stat"><div className="value">Sync</div><div className="label">Across devices</div></div>
      </div>
    </section>
  );
}
