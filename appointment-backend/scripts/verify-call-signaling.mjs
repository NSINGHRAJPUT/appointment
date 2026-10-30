import { io } from 'socket.io-client';

const API = 'http://localhost:4000';
const ROOM = process.env.APPOINTMENT_ID || 'cmvunhrzt0005exi8wopqxdna';

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${await res.text()}`);
  const json = await res.json();
  return json.accessToken;
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(`${API}/call`, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

const doctorToken = await login('demo.vet@pawcare.demo');
const patientToken = await login('demo.patient@pawcare.demo');

const doctor = await connect(doctorToken);
const patient = await connect(patientToken);

const peerJoinedDoctor = new Promise((resolve) =>
  doctor.once('peer:joined', resolve),
);
const peerJoinedPatient = new Promise((resolve) =>
  patient.once('peer:joined', resolve),
);

doctor.emit('call:join', { roomId: ROOM });
await new Promise((r) => setTimeout(r, 200));
patient.emit('call:join', { roomId: ROOM });

const [joinedForDoctor, joinedForPatient] = await Promise.race([
  Promise.all([peerJoinedDoctor, peerJoinedPatient]),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('peer:joined timeout')), 5000),
  ),
]);

console.log('peer:joined doctor got', joinedForDoctor);
console.log('peer:joined patient got', joinedForPatient);

const answerSeen = new Promise((resolve) => {
  doctor.on('call:signal', (payload) => {
    if (payload?.type === 'answer') resolve(payload);
  });
});

const offerSeen = new Promise((resolve) => {
  patient.on('call:signal', (payload) => {
    if (payload?.type === 'offer') {
      resolve(payload);
      patient.emit('call:signal', {
        roomId: ROOM,
        payload: { type: 'answer', sdp: { type: 'answer', sdp: 'v=0' } },
      });
    }
  });
});

doctor.emit('call:signal', {
  roomId: ROOM,
  payload: { type: 'offer', sdp: { type: 'offer', sdp: 'v=0' } },
});

const [offer, answer] = await Promise.race([
  Promise.all([offerSeen, answerSeen]),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('signal timeout')), 5000),
  ),
]);

console.log('offer relayed OK', offer.type);
console.log('answer relayed OK', answer.type);

const hangupSeen = new Promise((resolve) =>
  patient.once('call:hangup', resolve),
);
doctor.emit('call:hangup', { roomId: ROOM });
await Promise.race([
  hangupSeen,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('hangup timeout')), 5000),
  ),
]);
console.log('hangup relayed OK');

doctor.disconnect();
patient.disconnect();
console.log('SIGNALLING_OK');
process.exit(0);
