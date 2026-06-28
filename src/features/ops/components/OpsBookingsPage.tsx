'use client';

import {
  filterBookingTable,
  filterBookingsByStatus,
  openBookingModal,
  shiftCalendarMonth,
  updateBookingFilters
} from '../opsGlobalActions';

export function OpsBookingsPage() {
  return (
    <div className="page" id="page-bookings">
      <div className="section-head">
        <h2>All Bookings</h2>
        <div style={{display: 'flex', gap: '0.6rem', alignItems: 'center'}}>
          <input className="search-input" placeholder="Search bookings..." onInput={(event) => filterBookingTable(event.currentTarget)} />
          <button className="btn btn-primary btn-sm" onClick={openBookingModal}>+ New Booking</button>
        </div>
      </div>
      <div className="tabs">
        <button className="tab active" onClick={(event) => filterBookingsByStatus('all', event.currentTarget)}>All</button>
        <button className="tab" onClick={(event) => filterBookingsByStatus('confirmed', event.currentTarget)}>Confirmed</button>
        <button className="tab" onClick={(event) => filterBookingsByStatus('pending', event.currentTarget)}>Pending</button>
        <button className="tab" onClick={(event) => filterBookingsByStatus('completed', event.currentTarget)}>Completed</button>
        <button className="tab" onClick={(event) => filterBookingsByStatus('noshow', event.currentTarget)}>No-Shows</button>
      </div>
      <div className="filter-row">
        <select id="booking-period-filter" onChange={updateBookingFilters}>
          <option value="all">All upcoming</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="custom">Custom range</option>
        </select>
        <input type="date" id="booking-date-from" onChange={updateBookingFilters} />
        <input type="date" id="booking-date-to" onChange={updateBookingFilters} />
        <div className="filter-summary" id="booking-filter-summary">Showing all upcoming bookings</div>
      </div>
      <div className="calendar-shell">
        <div className="calendar-card">
          <div className="calendar-head">
            <div className="calendar-head-copy">
              <h3>Rental Calendar</h3>
              <p>See which dates customers want to rent, then click any day to view the full schedule.</p>
            </div>
            <div className="calendar-nav">
              <button className="calendar-btn" onClick={() => shiftCalendarMonth(-1)} aria-label="Previous month">←</button>
              <div className="calendar-month-label" id="calendar-month-label">Month Year</div>
              <button className="calendar-btn" onClick={() => shiftCalendarMonth(1)} aria-label="Next month">→</button>
            </div>
          </div>
          <div className="calendar-weekdays">
            <div className="calendar-weekday">Sun</div>
            <div className="calendar-weekday">Mon</div>
            <div className="calendar-weekday">Tue</div>
            <div className="calendar-weekday">Wed</div>
            <div className="calendar-weekday">Thu</div>
            <div className="calendar-weekday">Fri</div>
            <div className="calendar-weekday">Sat</div>
          </div>
          <div className="calendar-grid" id="booking-calendar-grid" />
        </div>
        <div className="agenda-card">
          <div className="agenda-head">
            <div>
              <h3>Selected Day</h3>
              <div className="agenda-date" id="calendar-agenda-date">Today</div>
              <div className="agenda-sub" id="calendar-agenda-sub">0 bookings scheduled</div>
            </div>
          </div>
          <div className="agenda-list" id="calendar-agenda-list" />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Phone</th><th>Craft</th><th>Date &amp; Time</th><th>Duration</th><th>Total</th><th>Deposit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="bookings-table" />
        </table>
      </div>
    </div>
  );
}
