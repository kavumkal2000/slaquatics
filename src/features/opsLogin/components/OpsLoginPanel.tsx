export function OpsLoginPanel() {
  return (
    <section className="panel">
      <div className="card">
        <h2>Sign In</h2>
        <p>Use your Shoreline ops username and password to open the private CRM.</p>
        <form id="login-form">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" placeholder="Enter your username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your Shoreline ops password" required />
          </div>
          <div className="turnstile-slot" id="turnstile-slot" hidden />
          <button className="submit" id="submit-btn" type="submit">Unlock Ops</button>
          <div className="status" id="status">Checking private service status...</div>
        </form>
        <div className="passkey-actions" id="passkey-actions">
          <button className="secondary-action" id="passkey-login-btn" type="button">Use Passkey</button>
          <button className="secondary-action" id="passkey-register-btn" type="button" hidden>Set Up Passkey</button>
        </div>
        <form className="client-link-form" id="client-magic-link-form">
          <label htmlFor="client-email">Client email</label>
          <div className="client-link-row">
            <input id="client-email" name="client-email" type="email" autoComplete="email" placeholder="Send a secure sign-in link" />
            <button className="secondary-action" id="client-link-btn" type="submit">Send Link</button>
          </div>
        </form>
        <form className="client-password-form" id="client-password-form" hidden>
          <label htmlFor="client-password">Optional client password</label>
          <div className="client-link-row">
            <input id="client-password" name="client-password" type="password" autoComplete="new-password" placeholder="6+ chars, uppercase, special" />
            <button className="secondary-action" id="client-password-btn" type="submit">Save Password</button>
          </div>
          <button className="text-action" id="client-password-skip-btn" type="button">Skip for now</button>
        </form>
        <div className="support" id="support-copy">
          If the private CRM is unavailable, contact Shoreline support or your site administrator.
          On iPhone, open this in Safari, tap Share, then Add to Home Screen.
        </div>
      </div>
    </section>
  );
}
