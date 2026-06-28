'use client';

import { closeOpsModal, saveMaint } from '../opsGlobalActions';

export function OpsMaintenanceModal() {
  const closeMaintModal = () => closeOpsModal('maint-modal');

  return (
    <div className="modal-overlay" id="maint-modal">
  <div className="modal" style={{width: 420}}>
    <div className="modal-head"><h3 id="maint-modal-title">Log Service</h3><button className="modal-close" onClick={closeMaintModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid">
        <div className="form-group"><label>Equipment</label>
          <input type="text" id="m-craft" list="maint-asset-options" placeholder="Jet Ski 1" />
          <datalist id="maint-asset-options" />
        </div>
        <div className="form-group"><label>Service type</label>
          <select id="m-type"><option>Oil change</option><option>Spark plugs</option><option>Impeller check</option><option>Full service</option><option>Repair</option><option>Winterization</option><option>De-winterization</option></select>
        </div>
        <div className="form-group"><label>Date</label><input type="date" id="m-date" /></div>
        <div className="form-group"><label>Hours at service</label><input type="number" id="m-hours" placeholder="0" step="0.1" /></div>
        <div className="form-group"><label>Cost ($)</label><input type="number" id="m-cost" placeholder="0" step="0.01" /></div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="m-notes" placeholder="What was done, parts replaced, etc." style={{minHeight: 60}} defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeMaintModal}>Cancel</button>
      <button className="btn btn-primary" id="maint-save-button" onClick={saveMaint}>Save Service Log</button>
    </div>
  </div>
</div>
  );
}
