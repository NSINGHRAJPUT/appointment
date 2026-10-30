const BASE = process.env.API_URL || 'http://localhost:4000';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
const PASSWORD = 'password123';

const results = [];
function pass(name, detail = '') {
  results.push({ status: 'PASS', name, detail });
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ status: 'FAIL', name, detail });
  console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
}

async function json(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data?.message
        ? JSON.stringify(data.message)
        : text;
    throw new Error(`${res.status} ${msg}`);
  }
  return data;
}

async function login(email) {
  const data = await json('/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  return data;
}

async function ensureAvailability(doctorToken) {
  const existing = await json('/availability', { token: doctorToken });
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const created = [];
  const today = new Date().getDay();
  for (const dayOfWeek of [today, (today + 1) % 7, (today + 2) % 7]) {
    try {
      const row = await json('/availability', {
        method: 'POST',
        token: doctorToken,
        body: {
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          slotMins: 30,
          timezoneOffsetMinutes: 330,
        },
      });
      created.push(row);
    } catch (e) {
      // ignore duplicates / validation
      console.log(`  availability create day=${dayOfWeek}: ${e.message}`);
    }
  }
  return created;
}

async function testSse(token) {
  return new Promise((resolve) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      ctrl.abort();
      resolve({ ok: false, detail: 'timeout waiting for heartbeat' });
    }, 15000);

    fetch(`${BASE}/notifications/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          clearTimeout(timer);
          resolve({ ok: false, detail: `status ${res.status}` });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          if (
            buf.includes('heartbeat') ||
            buf.includes('connected') ||
            buf.includes('event:')
          ) {
            clearTimeout(timer);
            ctrl.abort();
            resolve({
              ok: true,
              detail: buf.slice(0, 160).replace(/\n/g, ' | '),
            });
            return;
          }
        }
        clearTimeout(timer);
        resolve({ ok: false, detail: 'stream ended early: ' + buf.slice(0, 120) });
      })
      .catch((e) => {
        clearTimeout(timer);
        if (e.name === 'AbortError') return;
        resolve({ ok: false, detail: e.message });
      });
  });
}

async function main() {
  const patientLogin = await login('demo.patient@pawcare.demo');
  const doctorLogin = await login('demo.vet@pawcare.demo');
  const patientToken = patientLogin.accessToken;
  const doctorToken = doctorLogin.accessToken;
  const doctorId = doctorLogin.user.doctorProfile.id;
  pass('login', `doctorId=${doctorId}`);

  const avails = await ensureAvailability(doctorToken);
  pass('availability', `rows=${Array.isArray(avails) ? avails.length : 0}`);

  const slots = await json(`/doctors/${doctorId}/next-slots?count=12`, {
    token: patientToken,
  });
  if (!Array.isArray(slots) || slots.length === 0) {
    fail('next-slots', 'empty');
    throw new Error('No slots available for booking smoke test');
  }
  pass('next-slots', `count=${slots.length}`);

  const beforeDoctor = await json('/notifications/unread-count', {
    token: doctorToken,
  });
  const beforePatient = await json('/notifications/unread-count', {
    token: patientToken,
  });

  let appt = null;
  let lastErr = null;
  for (const slot of slots) {
    try {
      appt = await json('/appointments', {
        method: 'POST',
        token: patientToken,
        body: {
          doctorId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          reason: 'Notification smoke test',
        },
      });
      break;
    } catch (e) {
      lastErr = e.message;
    }
  }
  if (!appt) {
    fail('book', lastErr || 'unknown');
    throw new Error('Booking failed');
  }
  pass('book', `${appt.id} status=${appt.status}`);

  await new Promise((r) => setTimeout(r, 800));

  const doctorList = await json('/notifications?page=1&pageSize=20', {
    token: doctorToken,
  });
  const doctorNotif = (doctorList.items || []).filter(
    (n) => n.linkUrl === `/appointments/${appt.id}`,
  );
  if (doctorNotif.length) {
    pass(
      'doctor-book-notif',
      `${doctorNotif[0].type} | ${doctorNotif[0].title} | unread ${beforeDoctor.count}->${doctorList.unreadCount}`,
    );
  } else {
    fail(
      'doctor-book-notif',
      `unread=${doctorList.unreadCount} sample=${JSON.stringify(doctorList.items?.[0] || null)}`,
    );
  }

  const patientList = await json('/notifications?page=1&pageSize=20', {
    token: patientToken,
  });
  const patientNotif = (patientList.items || []).filter(
    (n) => n.linkUrl === `/appointments/${appt.id}`,
  );
  if (patientNotif.length) {
    pass(
      'patient-book-notif',
      `${patientNotif[0].type} | ${patientNotif[0].title} | unread ${beforePatient.count}->${patientList.unreadCount}`,
    );
  } else {
    fail('patient-book-notif', `unread=${patientList.unreadCount}`);
  }

  if (doctorNotif[0]?.linkUrl?.startsWith('/appointments/')) {
    pass('deep-link', doctorNotif[0].linkUrl);
  } else {
    fail('deep-link', doctorNotif[0]?.linkUrl || 'missing');
  }

  if (doctorNotif[0]) {
    const marked = await json(`/notifications/${doctorNotif[0].id}/read`, {
      method: 'PATCH',
      token: doctorToken,
    });
    if (marked.readAt) pass('mark-read', marked.readAt);
    else fail('mark-read', 'no readAt');
  }

  // Status change notification
  let target = appt.status === 'REQUESTED' ? 'CONFIRMED' : 'CANCELLED';
  // If already CONFIRMED (instant/free), cancel to generate another event then we're done
  try {
    const updated = await json(`/appointments/${appt.id}/status`, {
      method: 'PATCH',
      token: doctorToken,
      body: { status: target },
    });
    pass('status-update', updated.status);
    await new Promise((r) => setTimeout(r, 800));
    const expectType =
      target === 'CONFIRMED'
        ? 'APPOINTMENT_CONFIRMED'
        : 'APPOINTMENT_CANCELLED';
    const after = await json('/notifications?page=1&pageSize=20', {
      token: patientToken,
    });
    const hit = (after.items || []).find(
      (n) =>
        n.type === expectType && n.linkUrl === `/appointments/${appt.id}`,
    );
    if (hit) pass('status-notif', `${hit.type} | ${hit.title}`);
    else
      fail(
        'status-notif',
        `expected ${expectType}; got ${JSON.stringify((after.items || []).slice(0, 3))}`,
      );
  } catch (e) {
    fail('status-update', e.message);
  }

  const vapid = await json('/notifications/vapid-public-key', {
    token: patientToken,
  });
  if (vapid.publicKey) pass('vapid', vapid.publicKey.slice(0, 24));
  else fail('vapid', 'null');

  const endpoint = `https://example.com/push-smoke-${Date.now()}`;
  const sub = await json('/notifications/push-subscribe', {
    method: 'POST',
    token: patientToken,
    body: {
      endpoint,
      keys: {
        p256dh: 'BNcRdseUxyESrQpRpSOjsaMHqTBkB4Bxxxx',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
      userAgent: 'smoke-test',
    },
  });
  pass('push-subscribe', sub.id);
  const un = await json('/notifications/push-subscribe', {
    method: 'DELETE',
    token: patientToken,
    body: { endpoint },
  });
  pass('push-unsubscribe', JSON.stringify(un));

  const all = await json('/notifications/read-all', {
    method: 'POST',
    token: patientToken,
  });
  pass('mark-all-read', `updated=${all.updated}`);
  const zero = await json('/notifications/unread-count', {
    token: patientToken,
  });
  if (zero.count === 0) pass('unread-cleared');
  else fail('unread-cleared', String(zero.count));

  const sse = await testSse(doctorToken);
  if (sse.ok) pass('sse-stream', sse.detail);
  else fail('sse-stream', sse.detail);

  const swRes = await fetch(`${FRONTEND}/sw.js`);
  const swText = await swRes.text();
  if (swRes.ok && swText.includes("addEventListener('push'")) pass('sw.js');
  else fail('sw.js', `status=${swRes.status}`);

  const fails = results.filter((r) => r.status === 'FAIL').length;
  console.log('\n==== SUMMARY ====');
  for (const r of results) {
    console.log(`${r.status.padEnd(4)} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  }
  console.log(`\nFailed: ${fails} / ${results.length}`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
