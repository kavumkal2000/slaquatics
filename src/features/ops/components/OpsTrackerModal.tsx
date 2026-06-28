'use client';

import { closeTrackerModal, deleteTracker, saveTracker } from '../opsGlobalActions';

export function OpsTrackerModal() {
  return (
    <div className="modal-overlay" id="tracking-modal">
  <div className="modal" style={{width: 'min(760px,92vw)'}}>
    <div className="modal-head"><h3 id="tracking-modal-title">Add Tracker</h3><button className="modal-close" onClick={closeTrackerModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid full">
        <div className="form-group"><label>Device label</label><input type="text" id="t-name" placeholder="Jet Ski 1 tracker" /></div>
        <div className="form-group"><label>Provider</label><input type="text" id="t-provider" defaultValue="LandAirSea" /></div>
        <div className="form-group"><label>Model</label><input type="text" id="t-model" defaultValue="FiftyFour" /></div>
        <div className="form-group"><label>Serial number</label><input type="text" id="t-serial" placeholder="Tracker serial number" /></div>
        <div className="form-group"><label>Assigned asset</label>
          <select id="t-asset" />
        </div>
        <div className="form-group"><label>Status</label>
          <select id="t-status">
            <option value="active">Active</option>
            <option value="spare">Spare</option>
            <option value="installing">Installing</option>
            <option value="inactive">Inactive</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div className="form-group"><label>Payment plan</label><input type="text" id="t-payment-plan" defaultValue="Monthly" /></div>
        <div className="form-group"><label>Tracking plan</label><input type="text" id="t-tracking-plan" defaultValue="180 second updates" /></div>
        <div className="form-group"><label>Monthly fee</label><input type="number" id="t-monthly-fee" placeholder="Monthly device fee" step="0.01" /></div>
        <div className="form-group"><label>Activation fee</label><input type="number" id="t-activation-fee" placeholder="Activation fee" step="0.01" /></div>
        <div className="form-group"><label>Transaction ID</label><input type="text" id="t-transaction-id" placeholder="Provider transaction ID" /></div>
        <div className="form-group"><label>Authorization code</label><input type="text" id="t-auth-code" placeholder="Provider auth code" /></div>
        <div className="form-group"><label>Transaction date</label><input type="datetime-local" id="t-transaction-date" /></div>
        <div className="form-group"><label>ShareSpot / live map URL</label><input type="url" id="t-share-url" placeholder="https://..." /></div>
        <div className="form-group"><label>Last location check-in</label><input type="datetime-local" id="t-last-checkin" /></div>
        <div className="form-group"><label>Account / contact name</label><input type="text" id="t-contact-name" placeholder="Tracker account contact" /></div>
        <div className="form-group"><label>Contact email</label><input type="email" id="t-contact-email" placeholder="tracker-account@example.com" /></div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="t-notes" placeholder="Install notes, renewal reminders, or any LandAirSea details to keep with this tracker." defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeTrackerModal}>Cancel</button>
      <button className="btn btn-danger" id="tracking-delete-button" onClick={deleteTracker} style={{display: 'none'}}>Delete Tracker</button>
      <button className="btn btn-primary" id="tracking-save-button" onClick={saveTracker}>Save Tracker</button>
    </div>
  </div>
</div>
  );
}
