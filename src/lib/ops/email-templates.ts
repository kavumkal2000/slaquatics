type DetailItem = {
  label: string;
  value: string | number | null | undefined;
  href?: string;
};

type ActionLink = {
  label: string;
  href: string;
};

type EmailTemplateOptions = {
  eyebrow?: string;
  title: string;
  intro?: string;
  details?: DetailItem[];
  sections?: string[];
  actions?: ActionLink[];
  footerNote?: string;
};

const BRAND_COLOR = '#0b4f6c';
const ACCENT_COLOR = '#f5a623';
const INK_COLOR = '#12212b';
const MUTED_COLOR = '#5d7280';
const BORDER_COLOR = '#d8e6ed';
const SURFACE_COLOR = '#f4f9fb';

export function escapeEmailHtml(value: any) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] || char));
}

function paragraphHtml(value = '') {
  return escapeEmailHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 14px;color:${MUTED_COLOR};font-size:16px;line-height:1.58;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function detailRows(details: DetailItem[] = []) {
  const rows = details
    .filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== '')
    .map((item) => {
      const value = item.href
        ? `<a href="${escapeEmailHtml(item.href)}" style="color:${BRAND_COLOR};font-weight:700;text-decoration:none;">${escapeEmailHtml(item.value)}</a>`
        : escapeEmailHtml(item.value);
      return `
        <tr>
          <td style="padding:10px 0;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid ${BORDER_COLOR};">${escapeEmailHtml(item.label)}</td>
          <td style="padding:10px 0;color:${INK_COLOR};font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid ${BORDER_COLOR};">${value}</td>
        </tr>
      `;
    })
    .join('');

  if (!rows) return '';
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

function actionLinks(actions: ActionLink[] = []) {
  const links = actions
    .filter((action) => action.href && action.label)
    .map((action) => `
      <a href="${escapeEmailHtml(action.href)}" style="display:inline-block;margin:0 10px 10px 0;padding:13px 18px;border-radius:8px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;">${escapeEmailHtml(action.label)}</a>
    `)
    .join('');
  return links ? `<div style="margin:22px 0 10px;">${links}</div>` : '';
}

function sectionBlocks(sections: string[] = []) {
  const blocks = sections
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => `
      <div style="margin:18px 0;padding:16px 18px;border:1px solid ${BORDER_COLOR};border-radius:8px;background:${SURFACE_COLOR};">
        ${paragraphHtml(section)}
      </div>
    `)
    .join('');
  return blocks;
}

export function renderShorelineEmail({
  eyebrow = 'Shoreline Aquatics',
  title,
  intro = '',
  details = [],
  sections = [],
  actions = [],
  footerNote = 'Shoreline Aquatics on Lake Lewisville'
}: EmailTemplateOptions) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#e9f3f7;font-family:Arial,Helvetica,sans-serif;color:${INK_COLOR};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e9f3f7;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid ${BORDER_COLOR};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:0;background:${BRAND_COLOR};">
                <div style="height:6px;background:${ACCENT_COLOR};line-height:6px;">&nbsp;</div>
                <div style="padding:26px 28px;">
                  <div style="margin:0 0 10px;color:#f8d47c;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">${escapeEmailHtml(eyebrow)}</div>
                  <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.18;font-weight:800;">${escapeEmailHtml(title)}</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${intro ? paragraphHtml(intro) : ''}
                ${detailRows(details)}
                ${sectionBlocks(sections)}
                ${actionLinks(actions)}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:${SURFACE_COLOR};border-top:1px solid ${BORDER_COLOR};">
                <p style="margin:0;color:${MUTED_COLOR};font-size:13px;line-height:1.45;">${escapeEmailHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderBookingRequestCustomerEmail({
  booking,
  mapsUrl,
  directions
}: {
  booking: any;
  mapsUrl: string;
  directions: string;
}) {
  return renderShorelineEmail({
    eyebrow: 'Booking request received',
    title: 'We received your booking request',
    intro: `Hi ${String(booking.name || 'there').trim() || 'there'},\n\nYour Shoreline Aquatics booking request is in. If you still need to finish the deposit, open the booking site from the same device or contact us for help.`,
    details: [
      { label: 'Rental', value: booking.craftLabel || booking.craft || 'Rental package' },
      { label: 'Duration', value: booking.durationLabel || '-' },
      { label: 'Date', value: booking.date || 'Not selected' },
      { label: 'Start time', value: booking.time || 'Not selected' },
      { label: 'Quoted total', value: `$${Number(booking.total || 0).toFixed(2)}` },
      { label: 'Due today', value: `$${Number(booking.amountDueToday || 55).toFixed(2)}` },
      { label: 'Meeting spot', value: booking.location || booking.meetingSpot || 'Point Vista Park' },
      { label: 'Maps', value: 'Open directions', href: mapsUrl }
    ],
    sections: [`Point Vista Park Directions:\n${directions}`],
    actions: [{ label: 'Open Maps', href: mapsUrl }]
  });
}

export function renderBookingConfirmationEmail({
  booking,
  mapsUrl,
  directions
}: {
  booking: any;
  mapsUrl: string;
  directions: string;
}) {
  return renderShorelineEmail({
    eyebrow: 'Booking confirmed',
    title: 'Your reservation is confirmed',
    intro: `Hi ${String(booking.name || 'there').trim() || 'there'},\n\nYour Shoreline Aquatics booking deposit is paid and your reservation is confirmed. We will see you at the launch.`,
    details: [
      { label: 'Rental', value: booking.craftLabel || booking.craft || 'Shoreline rental' },
      { label: 'Date', value: booking.date || 'Launch day' },
      { label: 'Time', value: booking.time || 'Not selected' },
      { label: 'Paid today', value: `$${Number(booking.amountDueToday || 55).toFixed(2)}` },
      { label: 'Meeting spot', value: booking.location || booking.meetingSpot || 'Point Vista Park' },
      { label: 'Maps', value: 'Open directions', href: mapsUrl }
    ],
    sections: [`Point Vista Park Directions:\n${directions}`],
    actions: [{ label: 'Open Maps', href: mapsUrl }]
  });
}

export function renderOwnerBookingAlertEmail({
  booking,
  mapsUrl,
  directions
}: {
  booking: any;
  mapsUrl: string;
  directions: string;
}) {
  return renderShorelineEmail({
    eyebrow: 'Ops booking alert',
    title: 'New booking request submitted',
    intro: 'A new Shoreline booking request was submitted. Review the customer and booking details in Shoreline Ops.',
    details: [
      { label: 'Name', value: booking.name || 'Unknown' },
      { label: 'Email', value: booking.email || 'Not provided' },
      { label: 'Phone', value: booking.phone || 'Not provided' },
      { label: 'Package', value: booking.craftLabel || booking.craft || 'Rental package' },
      { label: 'Duration', value: booking.durationLabel || '-' },
      { label: 'Date', value: booking.date || 'Not selected' },
      { label: 'Start time', value: booking.time || 'Not selected' },
      { label: 'Party size', value: booking.partySize || 'Not provided' },
      { label: 'Quoted total', value: `$${Number(booking.total || 0).toFixed(2)}` },
      { label: 'Due today', value: `$${Number(booking.amountDueToday || 55).toFixed(2)}` },
      { label: 'Payment', value: booking.paymentStatus || 'unpaid' },
      { label: 'Booking status', value: booking.status || 'pending' },
      { label: 'Meeting spot', value: booking.location || booking.meetingSpot || 'Point Vista Park' },
      { label: 'Maps', value: 'Open directions', href: mapsUrl }
    ],
    sections: [
      `Point Vista Park Directions:\n${directions}`,
      `Notes:\n${booking.notes || 'None'}`
    ],
    actions: [{ label: 'Open Maps', href: mapsUrl }],
    footerNote: 'Shoreline Ops notification'
  });
}

export function renderOpsMessageEmail({ subject, body, audienceLabel }: { subject: string; body: string; audienceLabel?: string }) {
  return renderShorelineEmail({
    eyebrow: 'Shoreline Aquatics',
    title: subject || 'Shoreline Aquatics',
    intro: body || '',
    details: audienceLabel ? [{ label: 'Sent to', value: audienceLabel }] : [],
    footerNote: 'Reply to this email or contact Shoreline Aquatics if you need help.'
  });
}

export function renderReviewRequestEmail({
  customerName,
  text,
  googleUrl,
  facebookUrl
}: {
  customerName: string;
  text: string;
  googleUrl?: string;
  facebookUrl?: string;
}) {
  return renderShorelineEmail({
    eyebrow: 'Thank you for riding',
    title: 'How was your Shoreline rental?',
    intro: text,
    actions: [
      googleUrl ? { label: 'Review on Google', href: googleUrl } : null,
      facebookUrl ? { label: 'Review on Facebook', href: facebookUrl } : null
    ].filter(Boolean) as ActionLink[],
    footerNote: 'Thank you for choosing Shoreline Aquatics.'
  });
}

export function renderOwnerWeeklyDigestEmail({
  force,
  weekKey,
  bookingCount,
  pendingBookingCount,
  customerCount,
  reviewRequestCount
}: {
  force: boolean;
  weekKey: string;
  bookingCount: number;
  pendingBookingCount: number;
  customerCount: number;
  reviewRequestCount: number;
}) {
  return renderShorelineEmail({
    eyebrow: force ? 'Manual owner update' : 'Weekly owner update',
    title: 'Shoreline weekly owner update',
    intro: force ? 'A manual weekly owner update was requested from Shoreline Ops.' : 'Your scheduled Shoreline weekly owner update is ready.',
    details: [
      { label: 'Week', value: weekKey },
      { label: 'Bookings in ops', value: bookingCount },
      { label: 'Pending bookings', value: pendingBookingCount },
      { label: 'Customers in CRM', value: customerCount },
      { label: 'Review requests', value: reviewRequestCount }
    ],
    footerNote: 'Shoreline Ops weekly summary'
  });
}
