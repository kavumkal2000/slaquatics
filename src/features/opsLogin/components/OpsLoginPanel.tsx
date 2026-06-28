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
          <button className="submit" id="submit-btn" type="submit">Unlock Ops</button>
          <div className="status" id="status">Checking private service status...</div>
        </form>
        <div className="support" id="support-copy">
          If the private CRM is unavailable, contact Shoreline support or your site administrator.
          On iPhone, open this in Safari, tap Share, then Add to Home Screen.
        </div>
      </div>
    </section>
  );
}
