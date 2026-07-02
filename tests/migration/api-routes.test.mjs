import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { test } from 'node:test';

async function responseJson(response) {
  assert.equal(response.headers.get('content-type')?.includes('application/json'), true);
  return response.json();
}

function withEnv(values, fn) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of previous.entries()) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

function stripeSignatureHeader(rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

function runNodeScript(args, stdin = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('node', args, { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Command failed with code ${code}: ${stderr}`));
    });
    child.stdin.end(stdin);
  });
}

test('/api/health route returns Cloudflare-compatible health payload', async () => {
  const { GET } = await import('../../src/app/api/health/route.ts');

  const payload = await responseJson(await GET());

  assert.equal(payload.ok, true);
  assert.equal(payload.runtime, 'cloudflare');
  assert.equal(payload.storage, 'memory');
});

test('/api/health reports unavailable when persistent storage is required but not bound', async () => {
  await withEnv({ REQUIRE_SERVER_STORE: 'true' }, async () => {
    const route = await import(`../../src/app/api/health/route.ts?case=required-store-${Date.now()}`);

    const response = await route.GET();
    const payload = await responseJson(response);

    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.equal(payload.storage, 'unavailable');
    assert.match(payload.error, /OPS_DB is not available/);
  });
});

test('/api/public/integrations/status works without production secrets', async () => {
  const { GET } = await import('../../src/app/api/public/integrations/status/route.ts');

  const payload = await responseJson(await GET());

  assert.equal(payload.ok, true);
  assert.equal(payload.integrations.stripeConfigured, false);
  assert.equal(payload.integrations.smsConfigured, false);
  assert.equal(payload.integrations.emailConfigured, false);
  assert.equal(payload.integrations.socialAutomationConfigured, false);
});

test('/api/public routes answer legacy CORS preflight requests', async () => {
  const routePaths = [
    '../../src/app/api/public/availability/route.ts',
    '../../src/app/api/public/booking-request/route.ts',
    '../../src/app/api/public/create-checkout-session/route.ts',
    '../../src/app/api/public/waiver/route.ts'
  ];

  for (const routePath of routePaths) {
    const route = await import(`${routePath}?case=preflight-${Date.now()}`);
    assert.equal(typeof route.OPTIONS, 'function', `${routePath} should export OPTIONS`);
    const response = await route.OPTIONS(new Request('https://slaquatics.test/api/public/preflight', {
      method: 'OPTIONS',
      headers: { origin: 'https://booking.example' }
    }));

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://booking.example');
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET,POST,OPTIONS');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type, Accept');
    assert.equal(response.headers.get('access-control-max-age'), '86400');
    assert.equal(response.headers.get('vary'), 'Origin');
  }
});

test('/api/public JSON responses include legacy CORS headers', async () => {
  const integrationsRoute = await import(`../../src/app/api/public/integrations/status/route.ts?case=public-cors-get-${Date.now()}`);
  const bookingDraftRoute = await import(`../../src/app/api/public/booking-draft/route.ts?case=public-cors-post-${Date.now()}`);

  const getResponse = await integrationsRoute.GET(new Request('https://slaquatics.test/api/public/integrations/status', {
    headers: { origin: 'https://booking.example' }
  }));
  const postErrorResponse = await bookingDraftRoute.POST(new Request('https://slaquatics.test/api/public/booking-draft', {
    method: 'POST',
    headers: { origin: 'https://booking.example' },
    body: '{not-json'
  }));

  for (const response of [getResponse, postErrorResponse]) {
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://booking.example');
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET,POST,OPTIONS');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type, Accept');
    assert.equal(response.headers.get('access-control-max-age'), '86400');
    assert.equal(response.headers.get('vary'), 'Origin');
  }
});

test('/api/public/availability returns current public slot shape without Render', async () => {
  const { GET } = await import('../../src/app/api/public/availability/route.ts');
  const request = new Request('https://slaquatics.test/api/public/availability?date=2026-07-01&craft=jetski2&duration=2');

  const payload = await responseJson(await GET(request));

  assert.equal(payload.ok, true);
  assert.equal(payload.availabilityType, 'jetski');
  assert.deepEqual(payload.blockedTimes, []);
  assert.deepEqual(payload.availableTimes, ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']);
  assert.equal(payload.nextOpenTime, '10:00');
  assert.equal(payload.slotDetails.length, 9);
  assert.equal(payload.slotDetails[0].label, '10:00 AM');
  assert.equal(payload.slotDetails[0].canBook, true);
});

test('/api/public/availability blocks overlapping boat slots when fleet blocking is enabled', async () => {
  await withEnv({ ALLOW_DOUBLE_BOOKING: 'false' }, async () => {
    const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=availability-booking-${Date.now()}`);
    const availabilityRoute = await import(`../../src/app/api/public/availability/route.ts?case=availability-${Date.now()}`);

    const booking = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Boat Hold Guest',
        phone: '4695553030',
        email: 'boat-hold@example.com',
        craft: 'boat',
        duration: 2,
        date: '2026-08-30',
        time: '10:00',
        total: 450,
        waiver: {
          acceptedRisk: true,
          acceptedDamage: true,
          verified: true,
          dateOfBirth: '1992-02-02',
          initials: 'BH',
          signature: 'Boat Hold Guest'
        }
      })
    })));
    const availability = await responseJson(await availabilityRoute.GET(new Request('https://slaquatics.test/api/public/availability?date=2026-08-30&craft=boat&duration=2')));

    assert.equal(booking.ok, true);
    assert.equal(availability.ok, true);
    assert.equal(availability.availabilityType, 'boat');
    assert.deepEqual(availability.blockedTimes, ['10:00', '11:00']);
    assert.equal(availability.nextOpenTime, '12:00');
    assert.equal(availability.slotDetails.find((slot) => slot.time === '10:00').boatAvailable, false);
    assert.equal(availability.slotDetails.find((slot) => slot.time === '12:00').canBook, true);
  });
});

test('/api/public/booking-request rejects unavailable boat slots server-side', async () => {
  await withEnv({ ALLOW_DOUBLE_BOOKING: 'false' }, async () => {
    const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=availability-reject-${Date.now()}`);

    const first = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Boat First Guest',
        phone: '4695553130',
        email: 'boat-first@example.com',
        craft: 'boat',
        duration: 2,
        date: '2026-08-31',
        time: '10:00',
        waiver: {
          acceptedRisk: true,
          acceptedDamage: true,
          verified: true,
          dateOfBirth: '1991-03-13',
          initials: 'BF',
          signature: 'Boat First Guest'
        }
      })
    })));

    const secondResponse = await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Boat Second Guest',
        phone: '4695553131',
        email: 'boat-second@example.com',
        craft: 'boat',
        duration: 2,
        date: '2026-08-31',
        time: '11:00',
        waiver: {
          acceptedRisk: true,
          acceptedDamage: true,
          verified: true,
          dateOfBirth: '1991-03-14',
          initials: 'BS',
          signature: 'Boat Second Guest'
        }
      })
    }));
    const second = await responseJson(secondResponse);

    assert.equal(first.ok, true);
    assert.equal(secondResponse.status, 400);
    assert.match(second.error, /no longer available/i);
  });
});

test('/api/public/seasonal-lead stores a customer lead without Render', async () => {
  const { POST } = await import('../../src/app/api/public/seasonal-lead/route.ts');
  const request = new Request('https://slaquatics.test/api/public/seasonal-lead', {
    method: 'POST',
    body: JSON.stringify({ firstName: 'Alex', phone: '469-555-0101', email: 'alex@example.com', preferredChannel: 'sms' })
  });

  const payload = await responseJson(await POST(request));

  assert.equal(payload.ok, true);
  assert.equal(payload.preferredChannel, 'sms');
  assert.equal(payload.customer.name, 'Alex');
  assert.equal(payload.customer.bookings, 0);
});

test('/api/public/booking-draft creates and reads back a public booking token', async () => {
  const draftRoute = await import('../../src/app/api/public/booking-draft/route.ts');
  const bookingRoute = await import('../../src/app/api/public/booking/route.ts');
  const draftRequest = new Request('https://slaquatics.test/api/public/booking-draft', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Jordan Guest',
      phone: '4695550111',
      email: 'jordan@example.com',
      craft: 'jetski2',
      duration: 2,
      date: '2026-07-02',
      time: '10:00',
      total: 1,
      baseTotal: 1,
      drone: true,
      karaoke: false,
      tube: false
    })
  });

  const draft = await responseJson(await draftRoute.POST(draftRequest));
  const loaded = await responseJson(await bookingRoute.GET(new Request(`https://slaquatics.test/api/public/booking?token=${draft.booking.publicToken}`)));

  assert.equal(draft.ok, true);
  assert.equal(draft.booking.name, 'Jordan Guest');
  assert.equal(draft.booking.status, 'draft');
  assert.equal(loaded.booking.total, 365);
  assert.equal(loaded.booking.baseTotal, 315);
  assert.equal(loaded.booking.publicToken, draft.booking.publicToken);
  assert.equal(loaded.booking.drone, true);
  assert.equal(loaded.booking.droneAmount, 50);
  assert.equal(loaded.booking.karaoke, false);
  assert.equal(loaded.booking.karaokeAmount, 0);
  assert.equal(loaded.booking.tube, false);
  assert.equal(loaded.booking.tubeAmount, 0);
});

test('/api/public/booking-draft rejects boat-only add-ons for jet ski rentals', async () => {
  const draftRoute = await import(`../../src/app/api/public/booking-draft/route.ts?case=addon-gate-${Date.now()}`);
  const response = await draftRoute.POST(new Request('https://slaquatics.test/api/public/booking-draft', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Addon Gate Guest',
      phone: '4695550112',
      email: 'addon-gate@example.com',
      craft: 'jetski2',
      duration: 2,
      date: '2026-07-03',
      time: '10:00',
      karaoke: true,
      tube: true
    })
  }));
  const payload = await responseJson(response);

  assert.equal(response.status, 400);
  assert.match(payload.error, /karaoke and tube add-ons are only available/i);
});

test('/api/public/booking-request rejects bookings ending after 8 PM', async () => {
  const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=hours-validation-${Date.now()}`);
  const response = await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Late Booking Guest',
      phone: '4695550113',
      email: 'late-booking@example.com',
      craft: 'jetski2',
      duration: 4,
      date: '2026-07-03',
      time: '18:00',
      waiver: {
        acceptedRisk: true,
        acceptedDamage: true,
        verified: true,
        dateOfBirth: '1992-02-02',
        initials: 'LB',
        signature: 'Late Booking Guest'
      }
    })
  }));
  const payload = await responseJson(response);

  assert.equal(response.status, 400);
  assert.match(payload.error, /end by 8:00 PM/i);
});

test('/api/public/booking-request requires a completed waiver before saving', async () => {
  const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=booking-waiver-validation-${Date.now()}`);
  const missingWaiver = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
    method: 'POST',
    body: JSON.stringify({
      name: 'No Waiver Guest',
      phone: '4695550777',
      email: 'nowaiver@example.com',
      craft: 'jetski2',
      duration: 2,
      date: '2026-09-04',
      time: '10:00',
      total: 315
    })
  })));
  const incompleteWaiver = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Incomplete Waiver Guest',
      phone: '4695550778',
      email: 'incompletewaiver@example.com',
      craft: 'jetski2',
      duration: 2,
      date: '2026-09-04',
      time: '11:00',
      total: 315,
      waiver: { acceptedRisk: true, acceptedDamage: true }
    })
  })));

  assert.equal(missingWaiver.error, 'A completed waiver is required before saving this booking request.');
  assert.equal(incompleteWaiver.error, 'A completed waiver is required before saving this booking request.');
});

test('/api/public/booking-request customer email includes launch address and directions', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'email_request_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({ RESEND_API_KEY: 're_booking_request', RESEND_FROM_EMAIL: 'dock@slaquatics.test' }, async () => {
      const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=booking-email-directions-${Date.now()}`);
      const response = await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Email Directions Guest',
          phone: '4695550780',
          email: 'email-directions@example.com',
          craft: 'jetski2',
          duration: 2,
          date: '2026-09-04',
          time: '10:00',
          waiver: {
            acceptedRisk: true,
            acceptedDamage: true,
            verified: true,
            dateOfBirth: '1990-04-10',
            initials: 'ED',
            signature: 'Email Directions Guest'
          }
        })
      }));
      const payload = await responseJson(response);

      assert.equal(payload.ok, true);
      const resendRequests = requests.filter((request) => request.url.includes('api.resend.com/emails'));
      assert.equal(resendRequests.length, 1);
      const emailBody = JSON.parse(String(resendRequests[0].init.body));
      assert.deepEqual(emailBody.to, ['email-directions@example.com']);
      assert.match(emailBody.text, /Point Vista Rd, Hickory Creek, TX 75065, United States/);
      assert.match(emailBody.text, /Point Vista Park Directions/);
      assert.match(emailBody.text, /drive past it/i);
      assert.match(emailBody.text, /dead end/i);
      assert.match(emailBody.text, /walk down to the shoreline/i);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/public/booking-request preserves confirmed bookings when updating by token', async () => {
  await withEnv({ SESSION_SECRET: 'confirmed-public-update-session-secret', OPS_DEV_PASSWORD: 'confirmed-public-update-password' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=confirmed-public-update-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=confirmed-public-update-${Date.now()}`);
    const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=confirmed-public-update-${Date.now()}`);

    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'confirmed-public-update-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{
          id: 612,
          publicToken: 'confirmed-public-token',
          name: 'Confirmed Rider',
          phone: '4695556120',
          email: 'confirmed-public@example.com',
          craft: '2 Jet Skis',
          craftKey: 'jetski2',
          duration: 2,
          date: '2026-09-06',
          time: '10:00',
          status: 'confirmed',
          source: 'Website Booking',
          total: 315,
          deposit: true,
          paymentStatus: 'paid'
        }],
        customers: [],
        invoices: []
      })
    }));

    const updated = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
      method: 'POST',
      body: JSON.stringify({
        publicToken: 'confirmed-public-token',
        name: 'Confirmed Rider Updated',
        phone: '4695556120',
        email: 'confirmed-public@example.com',
        craft: 'jetski2',
        duration: 2,
        date: '2026-09-06',
        time: '10:00',
        waiver: {
          acceptedRisk: true,
          acceptedDamage: true,
          verified: true,
          dateOfBirth: '1990-06-12',
          initials: 'CR',
          signature: 'Confirmed Rider Updated',
          signatureDate: '2026-09-01'
        }
      })
    })));

    const synced = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const booking = synced.state.bookings.find((entry) => entry.publicToken === 'confirmed-public-token');

    assert.equal(updated.ok, true);
    assert.equal(updated.booking.status, 'confirmed');
    assert.equal(booking.status, 'confirmed');
    assert.equal(booking.name, 'Confirmed Rider Updated');
  });
});

test('/api/public/booking returns waiver details for token-protected booking recovery', async () => {
  const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=booking-waiver-recovery-${Date.now()}`);
  const bookingRoute = await import(`../../src/app/api/public/booking/route.ts?case=booking-waiver-recovery-${Date.now()}`);
  const created = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Waiver Recovery Guest',
      phone: '4695550888',
      email: 'waiverrecovery@example.com',
      craft: 'jetski2',
      duration: 2,
      date: '2026-09-05',
      time: '10:00',
      total: 315,
      waiver: {
        acceptedRisk: true,
        acceptedDamage: true,
        verified: true,
        dateOfBirth: '1991-05-20',
        initials: 'WR',
        signature: 'Waiver Recovery Guest',
        signatureDate: '2026-09-01',
        emergencyName: 'Emergency Contact',
        emergencyPhone: '4695550999'
      }
    })
  })));
  const loaded = await responseJson(await bookingRoute.GET(new Request(`https://slaquatics.test/api/public/booking?token=${created.booking.publicToken}`)));

  assert.equal(created.ok, true);
  assert.equal(loaded.booking.waiverAccepted, true);
  assert.equal(loaded.booking.waiver.acceptedRisk, true);
  assert.equal(loaded.booking.waiver.acceptedDamage, true);
  assert.equal(loaded.booking.waiver.verified, true);
  assert.equal(loaded.booking.waiver.dateOfBirth, '1991-05-20');
  assert.equal(loaded.booking.waiver.initials, 'WR');
  assert.equal(loaded.booking.waiver.signature, 'Waiver Recovery Guest');
  assert.equal(loaded.booking.waiver.signatureDate, '2026-09-01');
  assert.equal(loaded.booking.waiver.emergencyName, 'Emergency Contact');
  assert.equal(loaded.booking.waiver.emergencyPhone, '4695550999');
});

test('/api/public/customer-lookup and waiver use the same compatibility state store', async () => {
  const waiverRoute = await import('../../src/app/api/public/waiver/route.ts');
  const lookupRoute = await import('../../src/app/api/public/customer-lookup/route.ts');
  const waiverRequest = new Request('https://slaquatics.test/api/public/waiver', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Taylor',
      lastName: 'Rider',
      phone: '4695550222',
      email: 'taylor@example.com',
      dateOfBirth: '1994-04-15',
      acceptedAgreement: true,
      verified: true,
      initials: 'TR',
      signature: 'Taylor Rider'
    })
  });

  const waiver = await responseJson(await waiverRoute.POST(waiverRequest));
  const lookup = await responseJson(await lookupRoute.GET(new Request('https://slaquatics.test/api/public/customer-lookup?phone=4695550222')));

  assert.equal(waiver.ok, true);
  assert.equal(lookup.ok, true);
  assert.equal(lookup.found, true);
  assert.equal(lookup.customer.name, 'Taylor Rider');
  assert.equal(lookup.customer.waiverOnFile, true);
  assert.equal(lookup.customer.dateOfBirth, undefined);
  assert.equal(lookup.customer.waiverSignature, undefined);
  assert.equal(lookup.customer.waiverInitials, undefined);
  assert.equal(lookup.customer.emergencyName, undefined);
  assert.equal(lookup.customer.emergencyPhone, undefined);
  assert.equal(lookup.customer.phone, undefined);
  assert.equal(lookup.customer.email, undefined);
  assert.equal(lookup.customer.totalSpent, undefined);
});

test('/api/public/waiver requires the same completed waiver fields as server.js', async () => {
  const waiverRoute = await import(`../../src/app/api/public/waiver/route.ts?case=waiver-validation-${Date.now()}`);
  const missingRequired = await responseJson(await waiverRoute.POST(new Request('https://slaquatics.test/api/public/waiver', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Missing',
      lastName: 'Fields',
      phone: '4695550444',
      email: 'missing@example.com',
      acceptedAgreement: true,
      verified: true
    })
  })));
  const missingAgreement = await responseJson(await waiverRoute.POST(new Request('https://slaquatics.test/api/public/waiver', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Agreement',
      lastName: 'Missing',
      phone: '4695550445',
      email: 'agreement@example.com',
      dateOfBirth: '1990-01-01',
      initials: 'AM',
      signature: 'Agreement Missing',
      acceptedAgreement: false,
      verified: true
    })
  })));

  assert.equal(missingRequired.error, 'First name, last name, phone, email, date of birth, initials, and signature are required.');
  assert.equal(missingAgreement.error, 'Agreement and verification are both required.');
});

test('/api/auth login, session, logout, and /api/ops/state use signed same-origin cookies', async () => {
  const previousDevPassword = process.env.OPS_DEV_PASSWORD;
  const previousSessionSecret = process.env.SESSION_SECRET;
  process.env.OPS_DEV_PASSWORD = 'test-dev-password';
  process.env.SESSION_SECRET = 'test-session-secret-for-migration-suite';
  const loginRoute = await import('../../src/app/api/auth/login/route.ts');
  const sessionRoute = await import('../../src/app/api/auth/session/route.ts');
  const logoutRoute = await import('../../src/app/api/auth/logout/route.ts');
  const stateRoute = await import('../../src/app/api/ops/state/route.ts');
  const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'developer', password: 'test-dev-password' })
  }));
  const cookie = login.headers.get('set-cookie') || '';

  assert.equal(login.status, 200);
  assert.match(cookie, /sla_ops_session=/);

  const session = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
    headers: { cookie, origin: 'https://slaquatics.test' }
  })));
  const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
    headers: { cookie, origin: 'https://slaquatics.test' }
  })));
      const logout = await logoutRoute.POST(new Request('https://slaquatics.test/api/auth/logout', {
        method: 'POST',
        headers: { cookie, origin: 'https://slaquatics.test' }
      }));

  assert.equal(session.authenticated, true);
  assert.equal(session.user.role, 'developer');
  assert.ok(Array.isArray(state.state.bookings));
  assert.match(logout.headers.get('set-cookie') || '', /Max-Age=0/);
  if (previousDevPassword === undefined) delete process.env.OPS_DEV_PASSWORD;
  else process.env.OPS_DEV_PASSWORD = previousDevPassword;
  if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSessionSecret;
});

test('/api/auth login accepts native form-encoded submissions', async () => {
  await withEnv({
    SESSION_SECRET: 'form-login-session-secret',
    OPS_DEV_PASSWORD: 'form-login-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=form-login-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: 'developer', password: 'form-login-password' })
    }));

    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie') || '', /sla_ops_session=/);
  });
});

test('/api/auth logout and same-origin mutations reject missing origins', async () => {
  await withEnv({
    SESSION_SECRET: 'missing-origin-session-secret',
    OPS_DEV_PASSWORD: 'missing-origin-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=missing-origin-login-${Date.now()}`);
    const logoutRoute = await import(`../../src/app/api/auth/logout/route.ts?case=missing-origin-logout-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=missing-origin-state-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'missing-origin-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    const logout = await responseJson(await logoutRoute.POST(new Request('https://slaquatics.test/api/auth/logout', {
      method: 'POST',
      headers: { cookie },
      body: ''
    })));
    const state = await responseJson(await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie },
      body: JSON.stringify({ bookings: [], customers: [], invoices: [] })
    })));

    assert.equal(logout.error, 'Invalid request origin.');
    assert.equal(state.error, 'Invalid request origin.');
  });
});

test('/api/auth login accepts form-encoded submissions mislabeled as JSON', async () => {
  await withEnv({
    SESSION_SECRET: 'mislabeled-form-login-session-secret',
    OPS_DEV_PASSWORD: 'mislabeled-form-login-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=mislabeled-form-login-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new URLSearchParams({ username: 'developer', password: 'mislabeled-form-login-password' }).toString()
    }));

    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie') || '', /sla_ops_session=/);
  });
});

test('/api/auth login handles empty payloads as credential failures instead of parse failures', async () => {
  await withEnv({
    SESSION_SECRET: 'empty-login-session-secret',
    OPS_DEV_PASSWORD: 'empty-login-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=empty-login-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: ''
    }));
    const payload = await responseJson(login);

    assert.equal(login.status, 401);
    assert.equal(payload.error, 'Incorrect username or password.');
  });
});

test('/api/auth login rejects default credentials when ops secrets are not configured', async () => {
  const previousDevPassword = process.env.OPS_DEV_PASSWORD;
  const previousOpsPassword = process.env.OPS_PASSWORD;
  const previousSessionSecret = process.env.SESSION_SECRET;
  delete process.env.OPS_DEV_PASSWORD;
  delete process.env.OPS_PASSWORD;
  delete process.env.SESSION_SECRET;
  const loginRoute = await import('../../src/app/api/auth/login/route.ts');

  const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'developer', password: 'shoreline-admin' })
  }));

  assert.equal(login.status, 401);
  if (previousDevPassword === undefined) delete process.env.OPS_DEV_PASSWORD;
  else process.env.OPS_DEV_PASSWORD = previousDevPassword;
  if (previousOpsPassword === undefined) delete process.env.OPS_PASSWORD;
  else process.env.OPS_PASSWORD = previousOpsPassword;
  if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSessionSecret;
});

test('/api/auth login locks repeated failures for the same user and client', async () => {
  await withEnv({
    SESSION_SECRET: 'login-lock-session-secret',
    OPS_DEV_PASSWORD: 'login-lock-real-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=lockout-${Date.now()}`);
    const headers = {
      'content-type': 'application/json',
      'x-forwarded-for': '198.51.100.45'
    };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: 'developer', password: `bad-password-${attempt}` })
      }));
      assert.equal(response.status, 401);
    }

    const locked = await responseJson(await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: 'developer', password: 'login-lock-real-password' })
    })));

    assert.equal(locked.error, 'Too many attempts. Try again in 15 minute(s).');
  });
});

test('/api/auth cookies include Secure in production mode', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    await withEnv({
      NODE_ENV: 'production',
      SESSION_SECRET: 'secure-cookie-session-secret',
      OPS_DEV_PASSWORD: 'secure-cookie-password',
      TURNSTILE_SECRET_KEY: 'turnstile-production-secret'
    }, async () => {
      const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=secure-cookie-login-${Date.now()}`);
      const logoutRoute = await import(`../../src/app/api/auth/logout/route.ts?case=secure-cookie-logout-${Date.now()}`);
      const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'developer', password: 'secure-cookie-password', turnstileToken: 'valid-token' })
      }));
      const logout = await logoutRoute.POST(new Request('https://slaquatics.test/api/auth/logout', {
        method: 'POST',
        headers: { cookie: login.headers.get('set-cookie') || '', origin: 'https://slaquatics.test' }
      }));

      assert.match(login.headers.get('set-cookie') || '', /;\s*Secure(?:;|$)/);
      assert.match(logout.headers.get('set-cookie') || '', /;\s*Secure(?:;|$)/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/auth login fails closed in production when Turnstile is not configured', async () => {
  await withEnv({
    NODE_ENV: 'production',
    SESSION_SECRET: 'production-turnstile-session-secret',
    OPS_DEV_PASSWORD: 'production-turnstile-password',
    TURNSTILE_SECRET_KEY: undefined
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=prod-turnstile-missing-${Date.now()}`);
    const login = await responseJson(await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'production-turnstile-password' })
    })));

    assert.equal(login.error, 'Security check is not configured.');
  });
});

test('/api/auth client magic-link sends a single-use Resend link and consumes it into a revokable client session', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'email_magic_link_1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({
      RESEND_API_KEY: 're_magic_link',
      RESEND_FROM_EMAIL: 'bookings@slaquatics.test',
      AUTH_RESEND_FROM_EMAIL: 'auth@slaquatics.test',
      TURNSTILE_SECRET_KEY: undefined
    }, async () => {
      const magicRoute = await import(`../../src/app/api/auth/client/magic-link/route.ts?case=magic-send-${Date.now()}`);
      const consumeRoute = await import(`../../src/app/api/auth/magic-link/consume/route.ts?case=magic-consume-${Date.now()}`);
      const sessionRoute = await import(`../../src/app/api/auth/session/route.ts?case=magic-session-${Date.now()}`);
      const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=magic-client-state-${Date.now()}`);

      const send = await responseJson(await magicRoute.POST(new Request('https://slaquatics.test/api/auth/client/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email: 'Client.User+Lake@example.com' })
      })));
      const emailBody = JSON.parse(String(requests[0].init.body));
      const link = String(emailBody.html.match(/https:\/\/slaquatics\.test\/api\/auth\/magic-link\/consume\?token=[^"]+/)?.[0] || '').replace(/&amp;/g, '&');
      const token = new URL(link).searchParams.get('token') || '';

      assert.equal(send.ok, true);
      assert.equal(requests.length, 1);
      assert.equal(emailBody.from, 'auth@slaquatics.test');
      assert.equal(emailBody.to[0], 'client.user+lake@example.com');
      assert.match(emailBody.subject, /sign-in link/i);
      assert.ok(token.length > 40);
      assert.equal(emailBody.html.includes(token), true);

      const consume = await consumeRoute.GET(new Request(link));
      const cookie = consume.headers.get('set-cookie') || '';
      assert.equal(consume.status, 303);
      assert.match(cookie, /sla_ops_session=/);

      const session = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
        headers: { cookie, origin: 'https://slaquatics.test' }
      })));
      const opsState = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
        headers: { cookie, origin: 'https://slaquatics.test' }
      })));
      const replay = await consumeRoute.GET(new Request(link));

      assert.equal(session.authenticated, true);
      assert.equal(session.user.role, 'client');
      assert.equal(session.passkey.required, false);
      assert.equal(opsState.error, 'Ops access required.');
      assert.equal(replay.status, 303);
      assert.match(replay.headers.get('location') || '', /auth_error=magic-link-invalid/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/auth magic-link token consumption is atomic at the auth store boundary', async () => {
  await withEnv({
    SESSION_SECRET: 'atomic-magic-link-session-secret'
  }, async () => {
    const { hashAuthToken } = await import(`../../src/lib/ops/auth.ts?case=atomic-magic-${Date.now()}`);
    const { getOpsAuthStore } = await import(`../../src/lib/ops/auth-store.ts?case=atomic-magic-store-${Date.now()}`);
    const request = new Request('https://slaquatics.test/api/auth/client/magic-link', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.15' }
    });
    const store = await getOpsAuthStore();
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashAuthToken(token);
    await store.createMagicLink({
      tokenHash,
      email: 'atomic-client@example.com',
      roleIntent: 'client',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      ip: request.headers.get('x-forwarded-for') || '',
      userAgent: ''
    });

    assert.equal(await store.consumeMagicLink(tokenHash), true);
    assert.equal(await store.consumeMagicLink(tokenHash), false);
  });
});

test('/api/auth client magic-link requests are throttled per email and client', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'email_rate_limit' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    await withEnv({
      RESEND_API_KEY: 're_magic_link_rate_limit',
      AUTH_RESEND_FROM_EMAIL: 'auth@slaquatics.test',
      TURNSTILE_SECRET_KEY: undefined
    }, async () => {
      const magicRoute = await import(`../../src/app/api/auth/client/magic-link/route.ts?case=magic-rate-${Date.now()}`);
      const headers = { 'x-forwarded-for': '203.0.113.44' };
      for (let index = 0; index < 5; index += 1) {
        const response = await magicRoute.POST(new Request('https://slaquatics.test/api/auth/client/magic-link', {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: 'rate-limited-client@example.com' })
        }));
        assert.equal(response.status, 200);
      }

      const limited = await responseJson(await magicRoute.POST(new Request('https://slaquatics.test/api/auth/client/magic-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'rate-limited-client@example.com' })
      })));

      assert.equal(limited.error, 'Too many sign-in links requested. Please try again later.');
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/auth client magic-link session prompts optional password setup and can set a password', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'email_magic_link_password_setup' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({
      SESSION_SECRET: 'client-password-session-secret',
      RESEND_API_KEY: 're_magic_link_password',
      AUTH_RESEND_FROM_EMAIL: 'auth@slaquatics.test',
      TURNSTILE_SECRET_KEY: undefined
    }, async () => {
      const magicRoute = await import(`../../src/app/api/auth/client/magic-link/route.ts?case=magic-password-send-${Date.now()}`);
      const consumeRoute = await import(`../../src/app/api/auth/magic-link/consume/route.ts?case=magic-password-consume-${Date.now()}`);
      const sessionRoute = await import(`../../src/app/api/auth/session/route.ts?case=magic-password-session-${Date.now()}`);
      const passwordRoute = await import(`../../src/app/api/auth/client/password/route.ts?case=client-password-set-${Date.now()}`);
      const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=client-password-login-${Date.now()}`);

      await responseJson(await magicRoute.POST(new Request('https://slaquatics.test/api/auth/client/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email: 'Password.Client@example.com' })
      })));
      const emailBody = JSON.parse(String(requests[0].init.body));
      const link = String(emailBody.html.match(/https:\/\/slaquatics\.test\/api\/auth\/magic-link\/consume\?token=[^"]+/)?.[0] || '').replace(/&amp;/g, '&');
      const consume = await consumeRoute.GET(new Request(link));
      const cookie = consume.headers.get('set-cookie') || '';
      const initialSession = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
        headers: { cookie, origin: 'https://slaquatics.test' }
      })));

      assert.equal(initialSession.user.role, 'client');
      assert.equal(initialSession.clientPassword.canSet, true);
      assert.equal(initialSession.clientPassword.hasPassword, false);
      assert.equal(initialSession.clientPassword.shouldPrompt, true);

      const weak = await responseJson(await passwordRoute.POST(new Request('https://slaquatics.test/api/auth/client/password', {
        method: 'POST',
        headers: { cookie, origin: 'https://evil.example' },
        body: JSON.stringify({ password: 'Short!' })
      })));
      assert.equal(weak.error, 'Invalid request origin.');

      const saved = await responseJson(await passwordRoute.POST(new Request('https://slaquatics.test/api/auth/client/password', {
        method: 'POST',
        headers: { cookie, origin: 'https://slaquatics.test' },
        body: JSON.stringify({ password: 'Client!' })
      })));
      assert.equal(saved.ok, true);

      const updatedSession = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
        headers: { cookie, origin: 'https://slaquatics.test' }
      })));
      assert.equal(updatedSession.clientPassword.canSet, true);
      assert.equal(updatedSession.clientPassword.hasPassword, true);
      assert.equal(updatedSession.clientPassword.shouldPrompt, false);

      const clientLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'password.client@example.com', password: 'Client!' })
      }));
      const clientLoginPayload = await responseJson(clientLogin);
      assert.equal(clientLogin.status, 200);
      assert.equal(clientLoginPayload.user.role, 'client');
      assert.equal(clientLoginPayload.clientPassword.shouldPrompt, false);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ops password hash helper accepts six character privileged passwords with uppercase and special characters', async () => {
  const { stdout } = await runNodeScript([
    'scripts/generate-ops-password-hash.mjs',
    '--username',
    'developer',
    '--role',
    'developer',
    '--env',
    'production',
    '--password-stdin'
  ], 'Admin!\nAdmin!\n');

  assert.match(stdout, /INSERT INTO ops_auth_users/);
  assert.match(stdout, /pbkdf2-sha256:210000:/);
});

test('/api/auth legacy oauth route is disabled while first-party Resend magic links are active', async () => {
  await withEnv({
    TURNSTILE_SECRET_KEY: undefined
  }, async () => {
    const oauthRoute = await import(`../../src/app/api/auth/oauth/start/route.ts?case=oauth-unconfigured-${Date.now()}`);
    const magicRoute = await import(`../../src/app/api/auth/client/magic-link/route.ts?case=magic-unconfigured-${Date.now()}`);

    const oauth = await responseJson(await oauthRoute.POST(new Request('https://slaquatics.test/api/auth/oauth/start', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google' })
    })));
    const magic = await responseJson(await magicRoute.POST(new Request('https://slaquatics.test/api/auth/client/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'client@example.com' })
    })));

    assert.equal(oauth.error, 'OAuth sign-in is disabled.');
    assert.equal(magic.error, 'Resend email is not configured yet.');
  });
});

test('/api/auth session exposes privileged passkey enrollment state after password login', async () => {
  await withEnv({
    SESSION_SECRET: 'owner-passkey-session-secret',
    OPS_DEV_PASSWORD: 'developer-passkey-password',
    OPS_OWNER_PASSWORD: 'owner-passkey-password',
    OWNER_PASSKEY_GRACE_SECONDS: '604800'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=owner-passkey-login-${Date.now()}`);
    const sessionRoute = await import(`../../src/app/api/auth/session/route.ts?case=owner-passkey-session-${Date.now()}`);

    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'owner-passkey-password' })
    }));
    const payload = await responseJson(login);
    const session = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
      headers: { cookie: login.headers.get('set-cookie') || '' }
    })));

    assert.equal(login.status, 200);
    assert.equal(payload.user.role, 'owner');
    assert.equal(payload.passkey.required, true);
    assert.equal(payload.passkey.enrolled, false);
    assert.equal(payload.passkey.shouldPrompt, true);
    assert.equal(session.passkey.required, true);
    assert.equal(session.passkey.enrolled, false);
    assert.match(session.passkey.graceEndsAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(session.passkey.count, 0);

    const developerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'developer-passkey-password' })
    }));
    const developerPayload = await responseJson(developerLogin);
    const developerSession = await responseJson(await sessionRoute.GET(new Request('https://slaquatics.test/api/auth/session', {
      headers: { cookie: developerLogin.headers.get('set-cookie') || '' }
    })));

    assert.equal(developerLogin.status, 200);
    assert.equal(developerPayload.user.role, 'developer');
    assert.equal(developerPayload.passkey.required, false);
    assert.equal(developerPayload.passkey.enrolled, false);
    assert.equal(developerPayload.passkey.shouldPrompt, false);
    assert.equal(developerSession.passkey.required, false);
    assert.equal(developerSession.passkey.enrolled, false);
    assert.equal(developerSession.passkey.graceEndsAt, '');
    assert.equal(developerSession.passkey.count, 0);
  });
});

test('/api/auth passkey registration options require an owner password session and persist a challenge', async () => {
  await withEnv({
    SESSION_SECRET: 'passkey-options-session-secret',
    OPS_DEV_PASSWORD: 'passkey-options-dev-password',
    OPS_OWNER_PASSWORD: 'passkey-options-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=passkey-options-login-${Date.now()}`);
    const route = await import(`../../src/app/api/auth/passkey/register/options/route.ts?case=passkey-options-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'passkey-options-password' })
    }));
    const developerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'passkey-options-dev-password' })
    }));
    const unauthorized = await responseJson(await route.GET(new Request('https://slaquatics.test/api/auth/passkey/register/options')));
    const response = await route.GET(new Request('https://slaquatics.test/api/auth/passkey/register/options', {
      headers: { cookie: login.headers.get('set-cookie') || '' }
    }));
    const developerDenied = await responseJson(await route.GET(new Request('https://slaquatics.test/api/auth/passkey/register/options', {
      headers: { cookie: developerLogin.headers.get('set-cookie') || '' }
    })));
    const payload = await responseJson(response);

    assert.equal(unauthorized.error, 'Authentication required.');
    assert.equal(developerDenied.error, 'Owner access required.');
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.options.rp.name, 'Shoreline Aquatics');
    assert.equal(payload.options.user.name, 'owner');
    assert.ok(String(payload.options.challenge || '').length >= 20);
  });
});

test('/api/auth passkey registration enforces owner max of ten passkeys', async () => {
  await withEnv({
    SESSION_SECRET: 'passkey-limit-session-secret',
    OPS_OWNER_PASSWORD: 'passkey-limit-password'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=passkey-limit-login-${Date.now()}`);
    const route = await import(`../../src/app/api/auth/passkey/register/options/route.ts?case=passkey-limit-${Date.now()}`);
    const { getOpsAuthStore } = await import('../../src/lib/ops/auth-store.ts');
    const store = await getOpsAuthStore();
    const owner = await store.findUserForPasswordLogin('owner');
    for (let index = 0; index < 10; index += 1) {
      await store.createPasskey({
        userId: owner.id,
        credentialId: `owner-credential-${index}`,
        publicKey: `owner-public-key-${index}`,
        counter: index
      });
    }

    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'passkey-limit-password' })
    }));
    const response = await responseJson(await route.GET(new Request('https://slaquatics.test/api/auth/passkey/register/options', {
      headers: { cookie: login.headers.get('set-cookie') || '' }
    })));

    assert.equal(response.error, 'Passkey limit reached.');
  });
});

test('/api/auth passkey challenges and owner passkey limit are atomic at the auth store boundary', async () => {
  await withEnv({
    SESSION_SECRET: 'atomic-passkey-session-secret',
    OPS_OWNER_PASSWORD: 'atomic-passkey-password'
  }, async () => {
    const { hashAuthToken } = await import(`../../src/lib/ops/auth.ts?case=atomic-passkey-auth-${Date.now()}`);
    const { getOpsAuthStore } = await import(`../../src/lib/ops/auth-store.ts?case=atomic-passkey-store-${Date.now()}`);
    const store = await getOpsAuthStore();
    const owner = await store.findUserForPasswordLogin('owner');
    const challengeHash = hashAuthToken('atomic-passkey-challenge');
    await store.createChallenge({
      challengeHash,
      userId: owner.id,
      purpose: 'passkey-authentication',
      challenge: 'atomic-passkey-challenge',
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    assert.equal(await store.consumeChallenge(challengeHash), true);
    assert.equal(await store.consumeChallenge(challengeHash), false);

    for (let index = 0; index < 9; index += 1) {
      assert.equal(await store.createPasskey({
        userId: owner.id,
        credentialId: `atomic-owner-credential-${index}`,
        publicKey: `atomic-owner-public-key-${index}`,
        counter: index
      }, 10), true);
    }
    assert.equal(await store.createPasskey({
      userId: owner.id,
      credentialId: 'atomic-owner-credential-9',
      publicKey: 'atomic-owner-public-key-9',
      counter: 9
    }, 10), true);
    assert.equal(await store.createPasskey({
      userId: owner.id,
      credentialId: 'atomic-owner-credential-over-limit',
      publicKey: 'atomic-owner-public-key-over-limit',
      counter: 11
    }, 10), false);
  });
});

test('/api/auth passkey login challenge creation is throttled', async () => {
  await withEnv({
    SESSION_SECRET: 'passkey-options-rate-session-secret'
  }, async () => {
    const route = await import(`../../src/app/api/auth/passkey/login/options/route.ts?case=passkey-rate-${Date.now()}`);
    const headers = { 'x-forwarded-for': '203.0.113.77' };
    for (let index = 0; index < 20; index += 1) {
      const response = await route.GET(new Request('https://slaquatics.test/api/auth/passkey/login/options', { headers }));
      assert.equal(response.status, 200);
    }
    const limited = await responseJson(await route.GET(new Request('https://slaquatics.test/api/auth/passkey/login/options', { headers })));
    assert.equal(limited.error, 'Too many passkey attempts. Please try again shortly.');
  });
});

test('/api/auth owner password changes require owner session and password or passkey proof', async () => {
  await withEnv({
    SESSION_SECRET: 'owner-password-change-session-secret',
    OPS_DEV_PASSWORD: 'owner-password-change-dev',
    OPS_OWNER_PASSWORD: 'owner-password-change-old'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=owner-password-change-login-${Date.now()}`);
    const route = await import(`../../src/app/api/auth/owner/password/route.ts?case=owner-password-change-${Date.now()}`);
    const { createSessionCookie } = await import('../../src/lib/ops/auth.ts');
    const { getOpsAuthStore } = await import('../../src/lib/ops/auth-store.ts');
    const store = await getOpsAuthStore();

    const ownerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'owner-password-change-old' })
    }));
    const developerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'owner-password-change-dev' })
    }));

    const developerDenied = await responseJson(await route.POST(new Request('https://slaquatics.test/api/auth/owner/password', {
      method: 'POST',
      headers: { cookie: developerLogin.headers.get('set-cookie') || '', origin: 'https://slaquatics.test' },
      body: JSON.stringify({ currentPassword: 'owner-password-change-dev', newPassword: 'Admin!' })
    })));
    const wrongCurrent = await responseJson(await route.POST(new Request('https://slaquatics.test/api/auth/owner/password', {
      method: 'POST',
      headers: { cookie: ownerLogin.headers.get('set-cookie') || '', origin: 'https://slaquatics.test' },
      body: JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'Owner!' })
    })));
    const changedWithPassword = await responseJson(await route.POST(new Request('https://slaquatics.test/api/auth/owner/password', {
      method: 'POST',
      headers: { cookie: ownerLogin.headers.get('set-cookie') || '', origin: 'https://slaquatics.test' },
      body: JSON.stringify({ currentPassword: 'owner-password-change-old', newPassword: 'Owner!' })
    })));
    const loginWithNewPassword = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'Owner!' })
    }));

    const owner = await store.findUserForPasswordLogin('owner');
    const passkeyCookie = await createSessionCookie(owner, new Request('https://slaquatics.test/api/auth/owner/password'), { authMethod: 'passkey' });
    const changedWithPasskey = await responseJson(await route.POST(new Request('https://slaquatics.test/api/auth/owner/password', {
      method: 'POST',
      headers: { cookie: passkeyCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({ newPassword: 'Owner2!' })
    })));

    assert.equal(developerDenied.error, 'Owner access required.');
    assert.equal(wrongCurrent.error, 'Current password is incorrect.');
    assert.equal(changedWithPassword.ok, true);
    assert.equal(loginWithNewPassword.status, 200);
    assert.equal(changedWithPasskey.ok, true);
  });
});

test('ops CRM exposes owner-only passkey and password controls', async () => {
  const [workspaceSource, runtimeSource] = await Promise.all([
    import('node:fs/promises').then((fs) => fs.readFile(new URL('../../src/features/ops/components/OpsDashboardWorkspace.tsx', import.meta.url), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('../../src/features/ops/runtime/opsRuntime.client.js', import.meta.url), 'utf8'))
  ]);

  assert.match(workspaceSource, /id="owner-security-card"/);
  assert.match(workspaceSource, /data-owner-auth-action="add-passkey"/);
  assert.match(workspaceSource, /data-owner-auth-action="change-password"/);
  assert.match(runtimeSource, /function isOwnerSession\(\)/);
  assert.match(runtimeSource, /role \|\| ''\)\.toLowerCase\(\) === 'owner'/);
  assert.match(runtimeSource, /\/api\/auth\/owner\/password/);
  assert.match(runtimeSource, /\/api\/auth\/passkey\/register\/options/);
  assert.match(runtimeSource, /count >= 10/);
});

test('passkey verification source delegates WebAuthn checks and updates counters', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../../src/lib/ops/passkeys.ts', import.meta.url), 'utf8'));

  assert.match(source, /verifyRegistrationResponse/);
  assert.match(source, /expectedOrigin:\s*expectedOriginFor\(request\)/);
  assert.match(source, /expectedRPID:\s*rpIDFor\(request\)/);
  assert.match(source, /requireUserVerification:\s*true/);
  assert.match(source, /verifyAuthenticationResponse/);
  assert.match(source, /store\.updatePasskeyCounter/);
  assert.match(source, /authMethod:\s*'passkey'/);
});

test('/api/auth login requires Turnstile when the secret is configured', async () => {
  await withEnv({
    SESSION_SECRET: 'turnstile-login-session-secret',
    OPS_DEV_PASSWORD: 'turnstile-real-password',
    TURNSTILE_SECRET_KEY: 'turnstile-secret-for-test'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=turnstile-required-${Date.now()}`);
    const login = await responseJson(await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'turnstile-real-password' })
    })));

    assert.equal(login.error, 'Security check required.');
  });
});

test('/api/ops/system/health is developer-only and reports configured integrations', async () => {
  await withEnv({
    SESSION_SECRET: 'system-health-session-secret-with-enough-length',
    OPS_DEV_PASSWORD: 'system-health-dev-password',
    OPS_OWNER_PASSWORD: 'system-health-owner-password',
    STRIPE_SECRET_KEY: 'sk_test_system_health',
    STRIPE_WEBHOOK_SECRET: 'whsec_system_health',
    TWILIO_ACCOUNT_SID: 'ACsystemhealth',
    TWILIO_AUTH_TOKEN: 'twilio-system-health-token',
    TWILIO_FROM_NUMBER: '+14695550100',
    RESEND_API_KEY: 're_system_health',
    RESEND_FROM_EMAIL: 'dock@slaquatics.test',
    OWNER_UPDATE_EMAILS: 'owner@slaquatics.test',
    GOOGLE_REVIEW_URL: 'https://reviews.example/google',
    SOCIAL_AUTOMATION_WEBHOOK_URL: 'https://automation.example/social'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=health-login-${Date.now()}`);
    const healthRoute = await import(`../../src/app/api/ops/system/health/route.ts?case=health-${Date.now()}`);
    const ownerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'owner', password: 'system-health-owner-password' })
    }));
    const developerLogin = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'system-health-dev-password' })
    }));

    const ownerHealth = await healthRoute.GET(new Request('https://slaquatics.test/api/ops/system/health', {
      headers: { cookie: ownerLogin.headers.get('set-cookie') || '' }
    }));
    const developerHealth = await responseJson(await healthRoute.GET(new Request('https://slaquatics.test/api/ops/system/health', {
      headers: { cookie: developerLogin.headers.get('set-cookie') || '' }
    })));

    assert.equal(ownerHealth.status, 403);
    assert.equal(developerHealth.ok, true);
    assert.equal(developerHealth.runtime.storage, 'memory');
    assert.equal(developerHealth.runtime.sessionSecretSet, true);
    assert.equal(developerHealth.auth.ok, false);
    assert.equal(developerHealth.auth.storage, 'memory');
    assert.equal(developerHealth.auth.d1Ready, true);
    assert.equal(developerHealth.auth.magicLinkConfigured, true);
    assert.equal(developerHealth.auth.turnstileConfigured, false);
    assert.ok(developerHealth.auth.warnings.some((warning) => /Legacy env password fallback/.test(warning)));
    assert.ok(developerHealth.auth.warnings.some((warning) => /TURNSTILE_SECRET_KEY is not set/.test(warning)));
    assert.equal(developerHealth.integrations.stripeConfigured, true);
    assert.equal(developerHealth.integrations.stripeWebhookConfigured, true);
    assert.equal(developerHealth.integrations.smsConfigured, true);
    assert.equal(developerHealth.integrations.emailConfigured, true);
    assert.equal(developerHealth.integrations.ownerUpdateConfigured, true);
    assert.equal(developerHealth.integrations.reviewLinksConfigured, true);
    assert.equal(developerHealth.integrations.socialAutomationConfigured, true);
  });
});

test('/api/ops/integrations/status includes saved review links from ops state', async () => {
  await withEnv({
    SESSION_SECRET: 'ops-integrations-review-settings-secret',
    OPS_DEV_PASSWORD: 'ops-integrations-review-settings-password',
    TWILIO_ACCOUNT_SID: 'ACopsintegrations',
    TWILIO_AUTH_TOKEN: 'ops-integrations-twilio-token',
    TWILIO_FROM_NUMBER: '+14695550101',
    RESEND_API_KEY: 're_ops_integrations',
    RESEND_FROM_EMAIL: 'dock@slaquatics.test',
    GOOGLE_REVIEW_URL: undefined,
    FACEBOOK_REVIEW_URL: undefined
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=ops-integrations-login-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=ops-integrations-state-${Date.now()}`);
    const integrationsRoute = await import(`../../src/app/api/ops/integrations/status/route.ts?case=ops-integrations-status-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'ops-integrations-review-settings-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [],
        customers: [],
        invoices: [],
        reviewSettings: {
          googleUrl: 'https://reviews.example/saved-google',
          facebookUrl: '',
          autoSend: true,
          channel: 'sms'
        }
      })
    }));

    const payload = await responseJson(await integrationsRoute.GET(new Request('https://slaquatics.test/api/ops/integrations/status', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));

    assert.equal(payload.ok, true);
    assert.equal(payload.integrations.smsConfigured, true);
    assert.equal(payload.integrations.emailConfigured, true);
    assert.equal(payload.integrations.reviewLinksConfigured, true);
    assert.equal(payload.integrations.reviewGoogleUrl, 'https://reviews.example/saved-google');
    assert.equal(payload.integrations.reviewAutomationEnabled, true);
    assert.equal(payload.integrations.reviewChannel, 'sms');

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [],
        customers: [],
        invoices: [],
        reviewSettings: {
          googleUrl: '',
          facebookUrl: '',
          autoSend: false,
          channel: 'sms'
        }
      })
    }));
  });
});

test('/api/public/create-checkout-session creates a Stripe checkout session and stores pending payment state', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'cs_test_123', url: 'https://checkout.stripe.test/pay/cs_test_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  await withEnv({ STRIPE_SECRET_KEY: 'sk_test_route_parity', PUBLIC_SITE_URL: 'https://slaquatics.com' }, async () => {
    const route = await import(`../../src/app/api/public/create-checkout-session/route.ts?case=create-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=create-${Date.now()}`);
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=create-${Date.now()}`);
    const request = new Request('https://slaquatics.test/api/public/create-checkout-session', {
      method: 'POST',
      headers: { origin: 'https://slaquatics.com' },
      body: JSON.stringify({
        booking: {
          name: 'Payment Rider',
          phone: '4695551000',
          email: 'pay@example.com',
          craft: 'jetski2',
          duration: 2,
          date: '2026-07-09',
          time: '10:00',
          total: 1,
          baseTotal: 1,
          drone: true,
          karaoke: false,
          tube: false,
          waiver: {
            acceptedRisk: true,
            acceptedDamage: true,
            verified: true,
            initials: 'PR',
            signature: 'Payment Rider'
          }
        }
      })
    });

    const payload = await responseJson(await route.POST(request));

    assert.equal(payload.ok, true);
    assert.equal(payload.checkoutUrl, 'https://checkout.stripe.test/pay/cs_test_123');
    assert.equal(payload.sessionId, 'cs_test_123');
    assert.equal(payload.amountDue, 55);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /https:\/\/api\.stripe\.com\/v1\/checkout\/sessions/);
    assert.match(requests[0].init.headers.Authorization, /^Bearer sk_test_route_parity$/);
    const stripeParams = new URLSearchParams(String(requests[0].init.body));
    assert.match(String(stripeParams.get('success_url')), /booking-thank-you/);
    assert.ok(stripeParams.get('metadata[bookingId]'));
    assert.equal(stripeParams.get('metadata[totalQuote]'), '365');

    process.env.OPS_DEV_PASSWORD = 'payment-test-password';
    process.env.SESSION_SECRET = 'payment-test-session-secret';
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'payment-test-password' })
    }));
    const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: login.headers.get('set-cookie') || '' }
    })));
    const booking = state.state.bookings.find((entry) => entry.paymentSessionId === 'cs_test_123');
    assert.equal(booking.total, 365);
    assert.equal(booking.baseTotal, 315);
    assert.equal(booking.droneAmount, 50);
    assert.equal(booking.karaokeAmount, 0);
    assert.equal(booking.tubeAmount, 0);
    assert.equal(booking.paymentStatus, 'pending');
    assert.equal(booking.amountDueToday, 55);
    assert.equal(booking.waiverAccepted, true);
  });

  globalThis.fetch = originalFetch;
});

test('/api/public/create-checkout-session charges boat add-ons in Stripe and stores the due-today amount', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'cs_boat_addons_123', url: 'https://checkout.stripe.test/pay/cs_boat_addons_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({ STRIPE_SECRET_KEY: 'sk_test_boat_addons', PUBLIC_SITE_URL: 'https://slaquatics.com' }, async () => {
      const route = await import(`../../src/app/api/public/create-checkout-session/route.ts?case=boat-addons-${Date.now()}`);
      const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=boat-addons-${Date.now()}`);
      const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=boat-addons-${Date.now()}`);
      const payload = await responseJson(await route.POST(new Request('https://slaquatics.test/api/public/create-checkout-session', {
        method: 'POST',
        headers: { origin: 'https://slaquatics.com' },
        body: JSON.stringify({
          booking: {
            name: 'Boat Addons Guest',
            phone: '4695551777',
            email: 'boat-addons@example.com',
            craft: 'partyboat',
            duration: 2,
            date: '2026-07-10',
            time: '10:00',
            karaoke: true,
            tube: true,
            waiver: {
              acceptedRisk: true,
              acceptedDamage: true,
              verified: true,
              initials: 'BA',
              signature: 'Boat Addons Guest'
            }
          }
        })
      })));

      assert.equal(payload.ok, true);
      assert.equal(payload.amountDue, 155);
      assert.equal(requests.length, 1);
      const stripeParams = new URLSearchParams(String(requests[0].init.body));
      assert.equal(stripeParams.get('line_items[0][price_data][unit_amount]'), '5000');
      assert.equal(stripeParams.get('line_items[1][price_data][unit_amount]'), '500');
      assert.equal(stripeParams.get('line_items[2][price_data][product_data][name]'), 'Karaoke Setup');
      assert.equal(stripeParams.get('line_items[2][price_data][unit_amount]'), '5000');
      assert.equal(stripeParams.get('line_items[3][price_data][product_data][name]'), 'Pool Tube');
      assert.equal(stripeParams.get('line_items[3][price_data][unit_amount]'), '5000');
      assert.equal(stripeParams.get('metadata[karaokeAmount]'), '50.00');
      assert.equal(stripeParams.get('metadata[tubeAmount]'), '50.00');
      assert.equal(stripeParams.get('metadata[amountDueToday]'), '155.00');

      process.env.OPS_DEV_PASSWORD = 'payment-test-password';
      process.env.SESSION_SECRET = 'payment-test-session-secret';
      const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'developer', password: 'payment-test-password' })
      }));
      const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
        headers: { cookie: login.headers.get('set-cookie') || '' }
      })));
      const booking = state.state.bookings.find((entry) => entry.paymentSessionId === 'cs_boat_addons_123');
      assert.equal(booking.total, 420);
      assert.equal(booking.baseTotal, 320);
      assert.equal(booking.karaoke, true);
      assert.equal(booking.karaokeAmount, 50);
      assert.equal(booking.tube, true);
      assert.equal(booking.tubeAmount, 50);
      assert.equal(booking.depositAmount, 50);
      assert.equal(booking.processingFeeAmount, 5);
      assert.equal(booking.amountDueToday, 155);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/public/create-checkout-session rejects bookings ending after 8 PM before Stripe', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'cs_should_not_create_late', url: 'https://checkout.stripe.test/pay/cs_should_not_create_late' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({ STRIPE_SECRET_KEY: 'sk_test_late_checkout', PUBLIC_SITE_URL: 'https://slaquatics.com' }, async () => {
      const route = await import(`../../src/app/api/public/create-checkout-session/route.ts?case=late-checkout-${Date.now()}`);
      const response = await route.POST(new Request('https://slaquatics.test/api/public/create-checkout-session', {
        method: 'POST',
        headers: { origin: 'https://slaquatics.com' },
        body: JSON.stringify({
          booking: {
            name: 'Late Checkout Guest',
            phone: '4695551412',
            email: 'late-checkout@example.com',
            craft: 'jetski2',
            duration: 4,
            date: '2026-09-07',
            time: '18:00',
            waiver: {
              acceptedRisk: true,
              acceptedDamage: true,
              verified: true,
              initials: 'LC',
              signature: 'Late Checkout Guest'
            }
          }
        })
      }));
      const payload = await responseJson(response);

      assert.equal(response.status, 400);
      assert.match(payload.error, /end by 8:00 PM/i);
      assert.equal(requests.length, 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/public/create-checkout-session rejects unavailable boat slots before Stripe', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 'cs_should_not_create', url: 'https://checkout.stripe.test/pay/cs_should_not_create' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({ ALLOW_DOUBLE_BOOKING: 'false', STRIPE_SECRET_KEY: 'sk_test_availability_checkout', PUBLIC_SITE_URL: 'https://slaquatics.com' }, async () => {
      const bookingRequestRoute = await import(`../../src/app/api/public/booking-request/route.ts?case=checkout-availability-hold-${Date.now()}`);
      const checkoutRoute = await import(`../../src/app/api/public/create-checkout-session/route.ts?case=checkout-availability-${Date.now()}`);

      const hold = await responseJson(await bookingRequestRoute.POST(new Request('https://slaquatics.test/api/public/booking-request', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Checkout Hold Guest',
          phone: '4695551410',
          email: 'checkout-hold@example.com',
          craft: 'boat',
          duration: 2,
          date: '2026-09-07',
          time: '10:00',
          waiver: {
            acceptedRisk: true,
            acceptedDamage: true,
            verified: true,
            dateOfBirth: '1990-01-10',
            initials: 'CH',
            signature: 'Checkout Hold Guest'
          }
        })
      })));

      const checkoutResponse = await checkoutRoute.POST(new Request('https://slaquatics.test/api/public/create-checkout-session', {
        method: 'POST',
        headers: { origin: 'https://slaquatics.com' },
        body: JSON.stringify({
          booking: {
            name: 'Checkout Overlap Guest',
            phone: '4695551411',
            email: 'checkout-overlap@example.com',
            craft: 'boat',
            duration: 2,
            date: '2026-09-07',
            time: '11:00',
            waiver: {
              acceptedRisk: true,
              acceptedDamage: true,
              verified: true,
              initials: 'CO',
              signature: 'Checkout Overlap Guest'
            }
          }
        })
      }));
      const checkout = await responseJson(checkoutResponse);

      assert.equal(hold.ok, true);
      assert.equal(checkoutResponse.status, 400);
      assert.match(checkout.error, /no longer available/i);
      assert.equal(requests.length, 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/public/checkout-session retrieves Stripe session and marks the matching booking paid', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).includes('api.stripe.com/v1/checkout/sessions/')) {
      return new Response(JSON.stringify({
        id: 'cs_paid_123',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 5500,
        payment_intent: 'pi_paid_123',
        customer_email: 'paid@example.com',
        customer_details: { email: 'paid@example.com', name: 'Paid Rider' },
        metadata: { bookingId: '1', bookingToken: 'paid-token', processingFeeAmount: '5.00' },
        client_reference_id: '1'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (String(url).includes('api.resend.com/emails')) {
      return new Response(JSON.stringify({ id: 'email_paid_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  await withEnv({
    STRIPE_SECRET_KEY: 'sk_test_route_parity',
    RESEND_API_KEY: 're_checkout_paid',
    RESEND_FROM_EMAIL: 'dock@slaquatics.test'
  }, async () => {
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=verify-${Date.now()}`);
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=verify-${Date.now()}`);
    const route = await import(`../../src/app/api/public/checkout-session/route.ts?case=verify-${Date.now()}`);
    process.env.OPS_DEV_PASSWORD = 'payment-test-password';
    process.env.SESSION_SECRET = 'payment-test-session-secret';
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'payment-test-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';
    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{ id: 1, publicToken: 'paid-token', name: 'Paid Rider', email: 'paid@example.com', paymentSessionId: 'cs_paid_123', total: 315 }],
        customers: [],
        invoices: []
      })
    }));

    const payload = await responseJson(await route.GET(new Request('https://slaquatics.test/api/public/checkout-session?session_id=cs_paid_123')));
    const repeated = await responseJson(await route.GET(new Request('https://slaquatics.test/api/public/checkout-session?session_id=cs_paid_123')));

    assert.equal(payload.ok, true);
    assert.equal(repeated.ok, true);
    assert.equal(payload.session.paymentStatus, 'paid');
    assert.equal(payload.booking.paymentStatus, 'paid');
    assert.equal(payload.booking.deposit, true);
    assert.equal(payload.booking.paymentSessionId, 'cs_paid_123');
    assert.ok(payload.booking.paymentCompletedAt);
    assert.equal(payload.booking.paymentIntentId, 'pi_paid_123');
    const resendRequests = requests.filter((request) => request.url.includes('api.resend.com/emails'));
    assert.equal(resendRequests.length, 1);
    const emailBody = JSON.parse(String(resendRequests[0].init.body));
    assert.deepEqual(emailBody.to, ['paid@example.com']);
    assert.match(emailBody.subject, /Shoreline Aquatics booking confirmed/i);
    assert.match(emailBody.text, /Point Vista Rd, Hickory Creek, TX 75065, United States/);
    assert.match(emailBody.text, /Point Vista Park Directions/);
    assert.match(emailBody.text, /drive past it/i);
    assert.match(emailBody.text, /dead end/i);
    assert.match(emailBody.text, /walk down to the shoreline/i);
    const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const booking = state.state.bookings.find((entry) => entry.id === 1);
    assert.equal(booking.confirmationEmailId, 'email_paid_123');
    assert.ok(booking.confirmationEmailSentAt);
    assert.equal(state.state.communicationsLog[0].channel, 'booking-confirmation-email');
  });

  globalThis.fetch = originalFetch;
});

test('/api/webhooks/stripe verifies Stripe signature and applies checkout completion to booking state', async () => {
  await withEnv({ STRIPE_SECRET_KEY: 'sk_test_route_parity', STRIPE_WEBHOOK_SECRET: 'whsec_route_parity' }, async () => {
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=webhook-${Date.now()}`);
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=webhook-${Date.now()}`);
    const route = await import(`../../src/app/api/webhooks/stripe/route.ts?case=webhook-${Date.now()}`);
    process.env.OPS_DEV_PASSWORD = 'payment-test-password';
    process.env.SESSION_SECRET = 'payment-test-session-secret';
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'payment-test-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';
    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{ id: 44, publicToken: 'hook-token', name: 'Hook Rider', paymentSessionId: 'cs_hook_123', paymentStatus: 'pending' }],
        customers: [],
        invoices: []
      })
    }));
    const rawBody = JSON.stringify({
      id: 'evt_hook_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_hook_123',
          payment_status: 'paid',
          amount_total: 5500,
          payment_intent: 'pi_hook_123',
          metadata: { bookingId: '44', bookingToken: 'hook-token' },
          client_reference_id: '44'
        }
      }
    });

    const webhook = await responseJson(await route.POST(new Request('https://slaquatics.test/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': stripeSignatureHeader(rawBody, 'whsec_route_parity') },
      body: rawBody
    })));
    const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', { headers: { cookie, origin: 'https://slaquatics.test' } })));
    const booking = state.state.bookings.find((entry) => entry.id === 44);

    assert.equal(webhook.received, true);
    assert.equal(booking.paymentStatus, 'paid');
    assert.equal(booking.deposit, true);
    assert.equal(booking.paymentIntentId, 'pi_hook_123');
  });
});

test('ops messaging review owner update and social routes enforce auth and configured no-secret failures', async () => {
  const routes = [
    ['../../src/app/api/ops/messages/send/route.ts', { channel: 'sms', to: '4695551000', body: 'Hi' }, /Twilio SMS is not configured yet/],
    ['../../src/app/api/ops/owner-weekly-update/send/route.ts', { force: true }, /email-not-configured|missing-recipient/],
    ['../../src/app/api/ops/reviews/send/route.ts', { phone: '4695551000', customerName: 'Review Rider' }, /Review links are not configured yet/],
    ['../../src/app/api/ops/reviews/send-batch/route.ts', { recipients: [{ phone: '4695551000', name: 'Review Rider' }] }, /Review links are not configured yet/],
    ['../../src/app/api/ops/social/publish/route.ts', { caption: 'Lake day' }, /No social webhook is configured yet/]
  ];

  await withEnv({ OPS_DEV_PASSWORD: 'ops-route-password', SESSION_SECRET: 'ops-route-session-secret' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=ops-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'ops-route-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    for (const [modulePath, body, expectedError] of routes) {
      const route = await import(`${modulePath}?case=ops-${Date.now()}-${Math.random()}`);
      const unauthorized = await responseJson(await route.POST(new Request('https://slaquatics.test/api/ops/test', {
        method: 'POST',
        headers: { origin: 'https://slaquatics.test' },
        body: JSON.stringify(body)
      })));
      assert.equal(unauthorized.error, 'Authentication required.');

      const response = await route.POST(new Request('https://slaquatics.test/api/ops/test', {
        method: 'POST',
        headers: { cookie, origin: 'https://slaquatics.test' },
        body: JSON.stringify(body)
      }));
      const payload = await responseJson(response);
      if (modulePath.includes('owner-weekly-update')) {
        assert.equal(response.status, 200);
        assert.equal(payload.ok, true);
        assert.match(payload.result.reason, expectedError);
      } else {
        assert.equal(response.status, 400);
        assert.match(payload.error, expectedError);
      }
    }
  });
});

test('/api/ops/messages/send chunks mass email BCC recipients into batches of 50', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: `email_batch_${requests.length}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    await withEnv({
      OPS_DEV_PASSWORD: 'mass-email-password',
      SESSION_SECRET: 'mass-email-session-secret',
      RESEND_API_KEY: 're_mass_email',
      RESEND_FROM_EMAIL: 'dock@slaquatics.test'
    }, async () => {
      const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=mass-email-login-${Date.now()}`);
      const route = await import(`../../src/app/api/ops/messages/send/route.ts?case=mass-email-${Date.now()}`);
      const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'developer', password: 'mass-email-password' })
      }));
      const cookie = login.headers.get('set-cookie') || '';
      const recipients = Array.from({ length: 121 }, (_, index) => `guest${index}@example.com`);
      const response = await route.POST(new Request('https://slaquatics.test/api/ops/messages/send', {
        method: 'POST',
        headers: { cookie, origin: 'https://slaquatics.test' },
        body: JSON.stringify({
          channel: 'mass-email',
          bcc: recipients,
          subject: 'Shoreline Aquatics update',
          body: 'Lake day booking update from Shoreline Aquatics.'
        })
      }));
      const payload = await responseJson(response);

      assert.equal(payload.ok, true);
      assert.equal(payload.result.batches, 3);
      assert.equal(payload.result.recipientCount, 121);
      assert.equal(requests.length, 3);
      assert.deepEqual(requests.map((request) => JSON.parse(String(request.init.body)).bcc.length), [50, 50, 21]);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('/api/ops/customers/search finds email recipients from persisted ops state', async () => {
  await withEnv({
    OPS_DEV_PASSWORD: 'customer-search-password',
    SESSION_SECRET: 'customer-search-session-secret'
  }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=customer-search-login-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=customer-search-state-${Date.now()}`);
    const searchRoute = await import(`../../src/app/api/ops/customers/search/route.ts?case=customer-search-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'customer-search-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';
    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        customers: [
          { id: 101, name: 'Avery Carter', email: 'avery@example.com', phone: '469-555-0101', company: 'Lakehouse Group', crmTags: 'vip repeat' },
          { id: 102, name: 'Blake No Email', phone: '469-555-0102', crmNotes: 'Asked about July weekend' },
          { id: 103, name: 'Casey Reed', email: 'casey@example.com', phone: '469-555-0103', source: 'Website Booking' }
        ]
      })
    }));

    const response = await searchRoute.GET(new Request('https://slaquatics.test/api/ops/customers/search?q=lakehouse&emailOnly=true', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    }));
    const payload = await responseJson(response);

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.customers.length, 1);
    assert.equal(payload.customers[0].id, 101);
    assert.equal(payload.customers[0].email, 'avery@example.com');
    assert.equal(payload.customers[0].name, 'Avery Carter');
  });
});

test('booking payment waiver and ops-login workflow works through App Router routes without Render', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    if (target.includes('/v1/checkout/sessions/') && !target.endsWith('/checkout/sessions')) {
      return new Response(JSON.stringify({
        id: 'cs_workflow_123',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 5500,
        payment_intent: 'pi_workflow_123',
        metadata: { bookingId: '1', bookingToken: 'workflow-token', processingFeeAmount: '5.00' },
        client_reference_id: '1'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ id: 'cs_workflow_123', url: 'https://checkout.stripe.test/workflow' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  await withEnv({
    STRIPE_SECRET_KEY: 'sk_test_workflow',
    OPS_DEV_PASSWORD: 'workflow-password',
    SESSION_SECRET: 'workflow-session-secret'
  }, async () => {
    const createRoute = await import(`../../src/app/api/public/create-checkout-session/route.ts?case=workflow-${Date.now()}`);
    const checkoutRoute = await import(`../../src/app/api/public/checkout-session/route.ts?case=workflow-${Date.now()}`);
    const lookupRoute = await import(`../../src/app/api/public/customer-lookup/route.ts?case=workflow-${Date.now()}`);
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=workflow-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=workflow-${Date.now()}`);

    const create = await responseJson(await createRoute.POST(new Request('https://slaquatics.test/api/public/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        booking: {
          publicToken: 'workflow-token',
          name: 'Workflow Rider',
          phone: '4695551777',
          email: 'workflow@example.com',
          craft: 'jetski2',
          duration: 2,
          date: '2026-07-10',
          time: '11:00',
          total: 315,
          waiver: {
            acceptedRisk: true,
            acceptedDamage: true,
            verified: true,
            initials: 'WR',
            signature: 'Workflow Rider'
          }
        }
      })
    })));
    const paid = await responseJson(await checkoutRoute.GET(new Request('https://slaquatics.test/api/public/checkout-session?session_id=cs_workflow_123')));
    const lookup = await responseJson(await lookupRoute.GET(new Request('https://slaquatics.test/api/public/customer-lookup?phone=4695551777')));
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'workflow-password' })
    }));
    const state = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: login.headers.get('set-cookie') || '' }
    })));

    assert.equal(create.ok, true);
    assert.equal(paid.booking.paymentStatus, 'paid');
    assert.equal(lookup.customer.waiverOnFile, true);
    assert.equal(login.status, 200);
    assert.equal(state.state.bookings.some((booking) => booking.paymentSessionId === 'cs_workflow_123' && booking.deposit === true), true);
  });

  globalThis.fetch = originalFetch;
});

test('/api/ops/state filters employee and crew sessions and preserves hidden server fields on write', async () => {
  await withEnv({ SESSION_SECRET: 'state-role-session-secret' }, async () => {
    const { createSessionCookie } = await import(`../../src/lib/ops/auth.ts?case=roles-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=roles-${Date.now()}`);
    const developerCookie = await createSessionCookie({ username: 'developer', role: 'developer', displayName: 'Developer', password: '' });
    const employeeCookie = await createSessionCookie({ username: 'hugoprado', role: 'employee', displayName: 'Employee', password: '' });
    const crewCookie = await createSessionCookie({ username: 'crew', role: 'crew', displayName: 'Crew', password: '' });

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{
          id: 501,
          name: 'Private Rider',
          phone: '4695555001',
          email: 'private@example.com',
          notes: 'Do not expose',
          total: 415,
          date: '2026-07-15',
          time: '12:00',
          craftLabel: '2 Yamaha Jet Skis',
          status: 'pending',
          waiverSignedAt: '2026-07-01T00:00:00.000Z',
          deposit: false,
          paymentStatus: 'unpaid'
        }, {
          id: 502,
          name: 'Omitted Rider',
          phone: '4695555002',
          email: 'omitted@example.com',
          total: 275,
          date: '2026-07-16',
          time: '14:00',
          craftLabel: 'Single Jet Ski',
          status: 'pending',
          deposit: false,
          paymentStatus: 'unpaid'
        }],
        customers: [{
          id: 77,
          name: 'Private Rider',
          phone: '4695555001',
          email: 'private@example.com',
          totalSpent: 415,
          waiverSignedAt: '2026-07-01T00:00:00.000Z'
        }],
        invoices: [{ id: 1, bookingId: 501, amount: 415, status: 'open' }]
      })
    }));

    const employeeState = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: employeeCookie, origin: 'https://slaquatics.test' }
    })));

    assert.equal(employeeState.state.bookings[0].name, 'Private Rider');
    assert.equal(employeeState.state.bookings[0].phone, undefined);
    assert.equal(employeeState.state.bookings[0].email, undefined);
    assert.equal(employeeState.state.bookings[0].notes, undefined);
    assert.equal(employeeState.state.bookings[0].total, undefined);
    assert.deepEqual(employeeState.state.invoices, []);
    assert.equal(employeeState.state.customers[0].phone, undefined);
    assert.equal(employeeState.state.customers[0].waiverOnFile, true);

    employeeState.state.bookings[0].status = 'confirmed';
    employeeState.state.bookings = employeeState.state.bookings.slice(0, 1);
    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie: employeeCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify(employeeState.state)
    }));
    const afterEmployeeWrite = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' }
    })));
    assert.equal(afterEmployeeWrite.state.bookings[0].status, 'confirmed');
    assert.equal(afterEmployeeWrite.state.bookings[0].phone, '4695555001');
    assert.equal(afterEmployeeWrite.state.bookings[0].email, 'private@example.com');
    assert.equal(afterEmployeeWrite.state.bookings[0].total, 415);
    assert.ok(afterEmployeeWrite.state.bookings.find((booking) => booking.id === 502), 'employee writes must preserve omitted existing bookings');

    const crewState = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: crewCookie, origin: 'https://slaquatics.test' }
    })));
    assert.equal(crewState.state.bookings[0].name, 'Private Rider');
    assert.equal(crewState.state.bookings[0].phone, undefined);
    assert.equal(crewState.state.bookings[0].email, undefined);
    assert.deepEqual(crewState.state.customers, []);
    assert.deepEqual(crewState.state.invoices, []);

    crewState.state.bookings[0].checkedIn = true;
    crewState.state.bookings[0].status = 'completed';
    crewState.state.bookings.push({ id: 999, name: 'Injected Booking', checkedIn: true, status: 'completed' });
    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie: crewCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify(crewState.state)
    }));
    const afterCrewWrite = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' }
    })));
    assert.equal(afterCrewWrite.state.bookings[0].checkedIn, true);
    assert.equal(afterCrewWrite.state.bookings[0].status, 'completed');
    assert.equal(afterCrewWrite.state.bookings.some((booking) => booking.id === 999), false);
    assert.equal(afterCrewWrite.state.bookings[0].phone, '4695555001');
  });
});

test('/api/ops/state preserves server-owned digest metadata on full state writes', async () => {
  await withEnv({ SESSION_SECRET: 'state-server-owned-session-secret' }, async () => {
    const { createSessionCookie } = await import(`../../src/lib/ops/auth.ts?case=server-owned-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=server-owned-${Date.now()}`);
    const developerCookie = await createSessionCookie({ username: 'developer', role: 'developer', displayName: 'Developer', password: '' });

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [],
        customers: [],
        invoices: [],
        ownerWeeklyDigest: {
          lastSentAt: '2026-06-20T10:00:00.000Z',
          lastMessageId: 'digest_msg_current',
          lastWeekKey: '2026-W25'
        },
        communicationsLog: [{
          id: 70,
          date: '2026-06-20T10:00:00.000Z',
          channel: 'owner-weekly-digest-email',
          customerName: 'Owner',
          message: 'Weekly owner digest sent.'
        }]
      })
    }));

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [],
        customers: [],
        invoices: [],
        ownerWeeklyDigest: {
          lastSentAt: '2026-06-01T10:00:00.000Z',
          lastMessageId: 'digest_msg_stale',
          lastWeekKey: '2026-W22'
        },
        communicationsLog: []
      })
    }));

    const afterWrite = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie: developerCookie, origin: 'https://slaquatics.test' }
    })));

    assert.equal(afterWrite.state.ownerWeeklyDigest.lastSentAt, '2026-06-20T10:00:00.000Z');
    assert.equal(afterWrite.state.ownerWeeklyDigest.lastMessageId, 'digest_msg_current');
    assert.equal(afterWrite.state.ownerWeeklyDigest.lastWeekKey, '2026-W25');
    assert.equal(afterWrite.state.communicationsLog.some((entry) => entry.channel === 'owner-weekly-digest-email' && entry.message === 'Weekly owner digest sent.'), true);
  });
});

test('/api/ops/state read syncs customer records from bookings', async () => {
  await withEnv({ SESSION_SECRET: 'state-sync-session-secret', OPS_DEV_PASSWORD: 'state-sync-password' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=state-sync-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=state-sync-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'state-sync-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{
          id: 301,
          name: 'Sync Rider',
          phone: '4695553010',
          email: 'sync@example.com',
          date: '2026-09-12',
          time: '10:00',
          status: 'confirmed',
          total: 315,
          source: 'Ops Booking'
        }],
        customers: [],
        invoices: []
      })
    }));

    const synced = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const persisted = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const customer = synced.state.customers.find((entry) => entry.email === 'sync@example.com');
    const booking = synced.state.bookings.find((entry) => entry.id === 301);

    assert.equal(customer.name, 'Sync Rider');
    assert.equal(customer.bookings, 1);
    assert.equal(customer.totalSpent, 315);
    assert.equal(customer.lastBooking, '2026-09-12');
    assert.equal(booking.customerId, customer.id);
    assert.equal(persisted.state.customers.length, 1);
    assert.equal(persisted.state.bookings[0].customerId, customer.id);
  });
});

test('/api/ops/state read syncs booking payment state from invoices', async () => {
  await withEnv({ SESSION_SECRET: 'invoice-sync-session-secret', OPS_DEV_PASSWORD: 'invoice-sync-password' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=invoice-sync-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=invoice-sync-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'invoice-sync-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{
          id: 401,
          publicToken: 'invoice-sync-token',
          name: 'Invoice Sync Rider',
          phone: '4695554010',
          email: 'invoice-sync@example.com',
          date: '2026-09-20',
          time: '10:00',
          status: 'pending',
          source: 'Website Booking',
          total: 0,
          baseTotal: 0,
          processingFeeAmount: 5,
          amountDueToday: 55,
          paymentStatus: 'unpaid',
          deposit: false
        }],
        customers: [],
        invoices: [{
          id: 901,
          bookingId: 401,
          total: 320,
          paidAmount: 55,
          status: 'partial'
        }]
      })
    }));

    const synced = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const booking = synced.state.bookings.find((entry) => entry.id === 401);

    assert.equal(booking.total, 315);
    assert.equal(booking.baseTotal, 315);
    assert.equal(booking.paymentStatus, 'paid');
    assert.equal(booking.deposit, true);
    assert.equal(booking.status, 'confirmed');
    assert.ok(booking.paymentCompletedAt);
  });
});

test('/api/ops/state read creates website booking invoices with legacy booking links', async () => {
  await withEnv({ SESSION_SECRET: 'website-invoice-session-secret', OPS_DEV_PASSWORD: 'website-invoice-password' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=website-invoice-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=website-invoice-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'website-invoice-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        bookings: [{
          id: 402,
          publicToken: 'website-invoice-token',
          name: 'Website Invoice Rider',
          phone: '4695554020',
          email: 'website-invoice@example.com',
          craft: 'jetski2',
          craftKey: 'jetski2',
          craftLabel: '2 Yamaha Jet Skis',
          duration: 2,
          date: '2026-09-21',
          time: '10:00',
          status: 'confirmed',
          source: 'Website Booking',
          total: 315,
          baseTotal: 315,
          processingFeeAmount: 5,
          amountDueToday: 55,
          paymentStatus: 'paid',
          deposit: true,
          paymentSessionId: 'cs_website_invoice',
          paymentIntentId: 'pi_website_invoice',
          paymentCompletedAt: '2026-09-01T12:00:00.000Z'
        }],
        customers: [],
        invoices: []
      })
    }));

    const synced = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const invoice = synced.state.invoices.find((entry) => Number(entry.bookingId) === 402);

    assert.equal(invoice.invoiceNumber, 'SLA-WEB-20260901-402');
    assert.equal(invoice.bookingPublicToken, 'website-invoice-token');
    assert.equal(invoice.paymentSessionId, 'cs_website_invoice');
    assert.equal(invoice.paymentIntentId, 'pi_website_invoice');
    assert.equal(invoice.customerName, 'Website Invoice Rider');
    assert.equal(invoice.customerEmail, 'website-invoice@example.com');
    assert.equal(invoice.subTotal, 315);
    assert.equal(invoice.taxAmount, 5);
    assert.equal(invoice.total, 320);
    assert.equal(invoice.paidAmount, 55);
    assert.equal(invoice.balanceDue, 265);
    assert.equal(invoice.status, 'partially paid');
    assert.equal(invoice.rawFields.bookingId, '402');
    assert.equal(invoice.rawFields.amountDueToday, '55.00');
  });
});

test('/api/ops/state read includes collected invoices in customer spend rollups', async () => {
  await withEnv({ SESSION_SECRET: 'customer-invoice-rollup-session-secret', OPS_DEV_PASSWORD: 'customer-invoice-rollup-password' }, async () => {
    const loginRoute = await import(`../../src/app/api/auth/login/route.ts?case=customer-invoice-rollup-${Date.now()}`);
    const stateRoute = await import(`../../src/app/api/ops/state/route.ts?case=customer-invoice-rollup-${Date.now()}`);
    const login = await loginRoute.POST(new Request('https://slaquatics.test/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'developer', password: 'customer-invoice-rollup-password' })
    }));
    const cookie = login.headers.get('set-cookie') || '';

    await stateRoute.POST(new Request('https://slaquatics.test/api/ops/state', {
      method: 'POST',
      headers: { cookie, origin: 'https://slaquatics.test' },
      body: JSON.stringify({
        customers: [{
          id: 701,
          name: 'Invoice Rollup Rider',
          phone: '4695557010',
          email: 'rollup@example.com',
          totalSpent: 0,
          bookings: 0
        }],
        bookings: [{
          id: 501,
          customerId: 701,
          name: 'Invoice Rollup Rider',
          phone: '4695557010',
          email: 'rollup@example.com',
          date: '2026-10-02',
          time: '10:00',
          status: 'confirmed',
          total: 300,
          source: 'Ops Booking'
        }],
        invoices: [{
          id: 991,
          bookingId: 501,
          customerId: 701,
          customerName: 'Invoice Rollup Rider',
          customerEmail: 'rollup@example.com',
          total: 420,
          paidAmount: 420,
          status: 'paid'
        }, {
          id: 992,
          customerName: 'Invoice Rollup Rider',
          customerPhone: '4695557010',
          customerEmail: 'rollup@example.com',
          total: 80,
          paidAmount: 80,
          status: 'paid'
        }]
      })
    }));

    const synced = await responseJson(await stateRoute.GET(new Request('https://slaquatics.test/api/ops/state', {
      headers: { cookie, origin: 'https://slaquatics.test' }
    })));
    const customer = synced.state.customers.find((entry) => Number(entry.id) === 701);

    assert.equal(customer.bookings, 1);
    assert.equal(customer.totalSpent, 500);
    assert.equal(customer.lastBooking, '2026-10-02');
  });
});
