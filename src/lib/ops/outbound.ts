function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhone(value = '') {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(value || '').trim().startsWith('+')) return String(value || '').trim();
  return '';
}

function firstName(value = '') {
  return String(value || 'there').trim().split(/\s+/)[0] || 'there';
}

export async function sendTwilioSms({ to, body }: { to: string; body: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) throw new Error('Twilio SMS is not configured yet.');
  const destination = normalizePhone(to);
  if (!destination) throw new Error('A valid destination phone number is required.');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: destination, From: from, Body: String(body || '') })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message || 'Twilio rejected the message request.');
  return json;
}

export async function sendResendEmail({ to, subject, text, html, bcc = [], idempotencyKey = '' }: any) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error('Resend email is not configured yet.');
  }
  const recipients = Array.from(new Set((Array.isArray(to) ? to : [to]).map(normalizeEmail).filter(Boolean)));
  const bccRecipients = Array.from(new Set((Array.isArray(bcc) ? bcc : [bcc]).map(normalizeEmail).filter(Boolean)));
  if (!recipients.length) throw new Error('At least one valid recipient email is required.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': String(idempotencyKey) } : {})
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipients,
      bcc: bccRecipients.length ? bccRecipients : undefined,
      subject: subject || 'Shoreline Aquatics',
      text: text || '',
      html: html || `<p>${String(text || '')}</p>`
    })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.message || json?.error?.message || 'Resend rejected the email request.');
  return json;
}

export async function sendResendMassEmail({ to, subject, text, html, bcc = [] }: any) {
  const recipients = (Array.isArray(bcc) ? bcc : [bcc]).map(normalizeEmail).filter(Boolean);
  if (!recipients.length) throw new Error('At least one valid mass email recipient is required.');
  const result = await sendResendEmail({ to, subject, text, html, bcc: recipients });
  return { batches: 1, recipientCount: recipients.length, results: [result] };
}

export function reviewSettingsForState(state: any = null) {
  const stored = state?.reviewSettings || {};
  return {
    googleUrl: String(stored.googleUrl || process.env.GOOGLE_REVIEW_URL || '').trim(),
    facebookUrl: String(stored.facebookUrl || process.env.FACEBOOK_REVIEW_URL || '').trim(),
    channel: ['email', 'sms'].includes(String(stored.channel || '').toLowerCase()) ? String(stored.channel).toLowerCase() : 'sms'
  };
}

export function reviewLinksText(state: any = null) {
  const settings = reviewSettingsForState(state);
  return [
    settings.googleUrl ? `Google: ${settings.googleUrl}` : '',
    settings.facebookUrl ? `Facebook: ${settings.facebookUrl}` : ''
  ].filter(Boolean).join('\n');
}

export function reviewText(state: any, customerName = 'there') {
  return [
    `Hey ${firstName(customerName)}! Thanks again for riding with Shoreline Aquatics.`,
    'If you had a great time, we would really appreciate a quick review:',
    reviewLinksText(state)
  ].filter(Boolean).join('\n\n');
}

export async function dispatchSocialPost(payload: any) {
  const platformMap: Record<string, string | undefined> = {
    facebook: process.env.SOCIAL_FACEBOOK_WEBHOOK_URL,
    instagram: process.env.SOCIAL_INSTAGRAM_WEBHOOK_URL,
    x: process.env.SOCIAL_X_WEBHOOK_URL,
    tiktok: process.env.SOCIAL_TIKTOK_WEBHOOK_URL
  };
  const headers = {
    'Content-Type': 'application/json',
    ...(process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET ? { 'X-Shoreline-Webhook-Secret': process.env.SOCIAL_AUTOMATION_WEBHOOK_SECRET } : {})
  };
  const results = [];
  const selected = Array.isArray(payload.platforms) ? payload.platforms : [];
  for (const platform of selected) {
    const url = platformMap[platform];
    if (!url) continue;
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...payload, platform }) });
    if (!response.ok) throw new Error(await response.text().catch(() => 'Social webhook failed.'));
    results.push({ platform, status: response.status, body: await response.text().catch(() => '') });
  }
  if (process.env.SOCIAL_AUTOMATION_WEBHOOK_URL) {
    const response = await fetch(process.env.SOCIAL_AUTOMATION_WEBHOOK_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await response.text().catch(() => 'Social webhook failed.'));
    results.push({ platform: 'automation', status: response.status, body: await response.text().catch(() => '') });
  }
  if (!results.length) throw new Error('No social webhook is configured yet.');
  return results;
}
