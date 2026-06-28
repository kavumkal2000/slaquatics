export function WaiverSuccessCard() {
  return (
    <div className="success-card" id="success-card">
      <div className="block-label">Saved</div>
      <h2>You are all set.</h2>
      <div className="success-copy">
        Your waiver has been submitted successfully. If you still need to reserve a rental date, continue to booking below.
      </div>
      <div className="top-actions" style={{ marginTop: 16 }}>
        <a className="btn btn-primary" href="../jetski-booking/">Continue to booking</a>
        <a className="btn btn-ghost" href="../">Back to homepage</a>
      </div>
    </div>
  );
}
