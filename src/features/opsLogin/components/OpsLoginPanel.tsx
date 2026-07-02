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
          <div className="login-action-row">
            <button className="submit" id="submit-btn" type="submit">Login</button>
            <button className="passkey-icon-action" id="passkey-login-btn" type="button" aria-label="Use passkey" title="Use passkey">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M14 6.5a5.5 5.5 0 1 0 1.1 7.6h2.4v2.4H20v-2.4h2.5v-2.5h-7.4A5.5 5.5 0 0 0 14 6.5Zm-5.5 6.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
              </svg>
            </button>
          </div>
          <div className="status" id="status">Checking private service status...</div>
        </form>
        <div className="passkey-actions" id="passkey-actions">
          <button className="secondary-action" id="passkey-register-btn" type="button" hidden>Set Up Passkey</button>
        </div>
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
