'use client';

import { cancelOpsConfirm, resolveOpsConfirm } from '../opsGlobalActions';

export function OpsConfirmModal() {
  return (
    <div className="modal-overlay" id="ops-confirm-modal">
      <div className="modal" style={{width: 460}}>
        <div className="modal-head">
          <h3 id="ops-confirm-title">Are you sure?</h3>
          <button className="modal-close" onClick={cancelOpsConfirm}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-banner warn" id="ops-confirm-message">Confirm this action before continuing.</div>
          <div className="list-card" id="ops-confirm-detail-card" style={{marginTop: '1rem'}}>
            <h3 id="ops-confirm-detail-title">Details</h3>
            <p className="note-soft" id="ops-confirm-detail" style={{marginTop: '0.4rem'}} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" id="ops-confirm-cancel" onClick={cancelOpsConfirm}>Cancel</button>
          <button className="btn btn-danger" id="ops-confirm-action" onClick={resolveOpsConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
