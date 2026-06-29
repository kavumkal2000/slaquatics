'use client';

import { closeOpsModal, saveFuel } from '../opsGlobalActions';

export function OpsDiv8() {
  const closeFuelModal = () => closeOpsModal('fuel-modal');

  return (
    <div className="modal-overlay" id="fuel-modal">
  <div className="modal" style={{width: 420}}>
    <div className="modal-head"><h3 id="fuel-modal-title">Log Fuel</h3><button className="modal-close" onClick={closeFuelModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid">
        <div className="form-group"><label>Equipment</label>
          <input type="text" id="f-craft" list="fuel-asset-options" placeholder="Jet Ski 1" />
          <datalist id="fuel-asset-options" />
        </div>
        <div className="form-group"><label>Date</label><input type="date" id="f-date" /></div>
        <div className="form-group"><label>Gallons</label><input type="number" id="f-gallons" placeholder="0.0" step="0.1" /></div>
        <div className="form-group"><label>Price per gallon</label><input type="number" id="f-ppg" placeholder="3.85" step="0.01" defaultValue="3.85" /></div>
        <div className="form-group"><label>Rental hours this trip</label><input type="number" id="f-hours" placeholder="0" step="0.5" /></div>
        <div className="form-group"><label>Booking ref</label><input type="text" id="f-ref" placeholder="Customer name" /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeFuelModal}>Cancel</button>
      <button className="btn btn-primary" id="fuel-save-button" onClick={saveFuel}>Save Entry</button>
    </div>
  </div>
</div>
  );
}
