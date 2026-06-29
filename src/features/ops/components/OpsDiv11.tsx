'use client';

import { closeOpsModal, saveExpense, toggleExpenseSeasonFields } from '../opsGlobalActions';

export function OpsDiv11() {
  const closeExpenseModal = () => closeOpsModal('expense-modal');

  return (
    <div className="modal-overlay" id="expense-modal">
  <div className="modal" style={{width: 440}}>
    <div className="modal-head"><h3 id="expense-modal-title">Add Expense</h3><button className="modal-close" onClick={closeExpenseModal}>×</button></div>
    <div className="modal-body">
      <div className="form-grid">
        <div className="form-group"><label>Date</label><input type="date" id="e-date" /></div>
        <div className="form-group"><label>Amount</label><input type="number" id="e-amount" placeholder="0" step="0.01" /></div>
        <div className="form-group"><label>Category</label>
          <select id="e-category"><option value="delivery">Delivery</option><option value="maintenance">Maintenance</option><option value="marketing">Marketing</option><option value="supplies">Supplies</option><option value="other">Other</option></select>
        </div>
        <div className="form-group"><label>Schedule</label>
          <select id="e-recurring-type" onChange={toggleExpenseSeasonFields}>
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly recurring</option>
            <option value="yearly">Yearly recurring</option>
            <option value="seasonal">Seasonal monthly recurring</option>
          </select>
        </div>
        <div className="form-group"><label>Expense</label><input type="text" id="e-name" placeholder="Trailer gas, launch fee, ad spend" /></div>
        <div className="form-group" id="e-season-start-wrap"><label>Season starts</label>
          <select id="e-season-start">
            <option value={1}>January</option><option value={2}>February</option><option value={3}>March</option><option value={4}>April</option>
            <option value={5}>May</option><option value={6}>June</option><option value={7}>July</option><option value={8}>August</option>
            <option value={9}>September</option><option value={10}>October</option><option value={11}>November</option><option value={12}>December</option>
          </select>
        </div>
        <div className="form-group" id="e-season-end-wrap"><label>Season ends</label>
          <select id="e-season-end">
            <option value={1}>January</option><option value={2}>February</option><option value={3}>March</option><option value={4}>April</option>
            <option value={5}>May</option><option value={6}>June</option><option value={7}>July</option><option value={8}>August</option>
            <option value={9}>September</option><option value={10}>October</option><option value={11}>November</option><option value={12}>December</option>
          </select>
        </div>
        <div className="form-group" style={{gridColumn: '1/-1'}}><label>Notes</label><textarea id="e-notes" placeholder="Any extra detail you want to keep with this expense" defaultValue={""} /></div>
      </div>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={closeExpenseModal}>Cancel</button>
      <button className="btn btn-primary" id="expense-save-button" onClick={saveExpense}>Save Expense</button>
    </div>
  </div>
</div>
  );
}
