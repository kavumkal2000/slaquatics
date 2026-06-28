'use client';

declare global {
  interface Window {
    closeModal?: (id: string) => void;
    importCRMFromTextarea?: () => void;
  }
}

export function OpsCrmPasteImportModal() {
  const closePasteModal = () => {
    window.closeModal?.('crm-paste-modal');
  };
  const importCRMData = () => {
    window.importCRMFromTextarea?.();
  };

  return (
    <div className="modal-overlay" id="crm-paste-modal">
  <div className="modal" style={{width: 'min(760px,92vw)'}}>
    <div className="modal-head"><h3>Paste Admin Tribe CSV</h3><button className="modal-close" onClick={closePasteModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid full">
        <div className="form-group">
          <label>CSV data</label>
          <textarea id="crm-paste-data" placeholder="Paste Contacts or Opportunities CSV content from Admin Tribe here..." defaultValue={""} />
        </div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closePasteModal}>Cancel</button>
      <button className="btn btn-primary" onClick={importCRMData}>Import CRM Data</button>
    </div>
  </div>
</div>
  );
}
