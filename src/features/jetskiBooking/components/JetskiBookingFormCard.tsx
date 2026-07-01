import { defaultBookingFlowPanelContent, type BookingFlowPanelContent } from '../../../lib/site-cms/booking-panels';

type JetskiBookingFormCardProps = {
  content?: BookingFlowPanelContent;
};

const addonInputIds: Record<BookingFlowPanelContent['addons'][number]['id'], string> = {
  drone: 'addon-drone',
  karaoke: 'addon-karaoke',
  tube: 'addon-tube'
};

const addonRowIds: Partial<Record<BookingFlowPanelContent['addons'][number]['id'], string>> = {
  karaoke: 'addon-karaoke-row',
  tube: 'addon-tube-row'
};

export function JetskiBookingFormCard({ content = defaultBookingFlowPanelContent }: JetskiBookingFormCardProps) {
  return (
    <div className="form-card" id="booking-form-card">
      <h2 className="section-title">{content.heading}</h2>
      <p className="section-copy">
        {content.copy}
      </p>
      <form id="booking-form">
        <input id="booking-token" type="hidden" defaultValue="" />
        <div className="form-stack">
          <div className="calendar-card">
            <div className="block-label">Calendar</div>
            <div className="calendar-shell">
              <div className="calendar-frame">
                <div className="calendar-head">
                  <div>
                    <h3>{content.calendarHeading}</h3>
                    <p>{content.calendarCopy}</p>
                  </div>
                  <div className="calendar-nav">
                    <button type="button" aria-label="Previous month">←</button>
                    <div className="calendar-month" id="calendar-month">Month Year</div>
                    <button type="button" aria-label="Next month">→</button>
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
                <div className="calendar-grid" id="calendar-grid" />
              </div>
              <div className="calendar-summary">
                <div className="calendar-picked"><span>{content.selectedLabel}</span><span id="calendar-pill-date">Today</span></div>
                <div className="calendar-big-date" id="calendar-big-date">Today</div>
                <p id="calendar-copy">{content.calendarSummaryCopy}</p>
                <div className="calendar-mini">
                  <div className="calendar-mini-item">
                    <strong>{content.requestedDateLabel}</strong>
                    <span id="calendar-selected-inline">Today</span>
                  </div>
                  <div className="field">
                    <label htmlFor="date">{content.requestedDateLabel}</label>
                    <input id="date" name="date" type="date" required />
                  </div>
                  <div className="field">
                    <label htmlFor="time">{content.timeLabel}</label>
                    <select id="time" name="time" required>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                    <div className="field-hint" id="availability-note" hidden />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="summary-card holiday-special" id="holiday-special" hidden>
            <div className="summary-kicker" id="holiday-title">{content.holidayTitle}</div>
            <p className="holiday-note" id="holiday-note">{content.holidayNote}</p>
            <div className="holiday-options" id="holiday-options" />
          </div>
          <div className="summary-card bottom-summary">
            <div className="summary-kicker">{content.summaryKicker}</div>
            <h3>{content.summaryHeading}</h3>
            <div className="summary-total" id="summary-total">$300</div>
            <div className="summary-title" id="summary-title">2 Yamaha Jet Skis</div>
            <div className="summary-note" id="summary-note">2 hour rental with 2 Yamaha jet skis, life jackets, a full tank, and safety briefing included.</div>
            <div className="summary-highlight">
              <div className="summary-highlight-item">
                <strong id="summary-rate-label">Hourly rate</strong>
                <span id="summary-rate">$79/hr per ski</span>
              </div>
              <div className="summary-highlight-item">
                <strong id="summary-value-label">Savings</strong>
                <span id="summary-value">Base rate</span>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-row"><span>Duration</span><strong id="summary-duration">2 hours</strong></div>
              <div className="summary-row"><span>Rental date</span><strong id="summary-date">Today</strong></div>
              <div className="summary-row"><span>Start time</span><strong id="summary-time">10:00 AM</strong></div>
              <div className="summary-row"><span>{content.dueTodayLabel}</span><strong>$55</strong></div>
            </div>
            <div className="footer-note" style={{ marginTop: 18 }}>
              {content.changePackageNote}
            </div>
          </div>
          <div className="summary-card" style={{ marginTop: 14 }}>
            <div className="summary-kicker">{content.addonsKicker}</div>
            {content.addons.map((addon, index) => (
              <label
                id={addonRowIds[addon.id]}
                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0', cursor: 'pointer', borderBottom: index === content.addons.length - 1 ? undefined : '1px solid rgba(255,255,255,0.08)' }}
                key={addon.id}
              >
                <input type="checkbox" id={addonInputIds[addon.id]} style={{ width: 18, height: 18, accentColor: 'var(--gold)' }} />
                <span style={{ flex: 1 }}>{addon.label}</span><strong style={{ color: 'var(--gold)' }}>{addon.priceLabel}</strong>
              </label>
            ))}
          </div>
          <div hidden aria-hidden="true">
            <span id="craft-label" />
            <select id="craft" name="craft" required />
            <select id="duration" name="duration" required />
          </div>
        </div>
        <div className="status" id="form-status" />
        <button className="btn btn-primary" type="submit">{content.submitLabel}</button>
        <div className="footer-note">
          {content.footerNote}
        </div>
      </form>
    </div>
  );
}
