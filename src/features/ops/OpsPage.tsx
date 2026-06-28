import { OpsBookingModal } from './components/OpsBookingModal';
import { OpsClientBehavior } from './OpsClientBehavior';
import { OpsCustomerModal } from './components/OpsCustomerModal';
import { OpsStructuredData } from './OpsStructuredData';
import { OpsStyles } from './OpsStyles';
import { OpsCrmPasteImportModal } from './components/OpsCrmPasteImportModal';
import { OpsExpenseModal } from './components/OpsExpenseModal';
import { OpsFuelModal } from './components/OpsFuelModal';
import { OpsInstallBanner } from './components/OpsInstallBanner';
import { OpsInvoiceModal } from './components/OpsInvoiceModal';
import { OpsLoadingGate } from './components/OpsLoadingGate';
import { OpsMaintenanceModal } from './components/OpsMaintenanceModal';
import { OpsMobileNavBackdrop } from './components/OpsMobileNavBackdrop';
import { OpsSidebar } from './components/OpsSidebar';
import { OpsToastRegion } from './components/OpsToastRegion';
import { OpsTrackerModal } from './components/OpsTrackerModal';
import { OpsDashboardWorkspace } from './components/OpsDashboardWorkspace';

export function OpsPage() {
  return (
    <>
      <OpsStyles />
      <OpsStructuredData />
      <OpsInstallBanner />
      <OpsLoadingGate />
      <OpsSidebar />
      <OpsMobileNavBackdrop />
      <OpsDashboardWorkspace />
      <OpsBookingModal />
      <OpsInvoiceModal />
      <OpsFuelModal />
      <OpsMaintenanceModal />
      <OpsCustomerModal />
      <OpsExpenseModal />
      <OpsTrackerModal />
      <OpsCrmPasteImportModal />
      <OpsToastRegion />
      <OpsClientBehavior />
    </>
  );
}
