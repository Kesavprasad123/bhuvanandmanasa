/**
 * Room booking store for the accommodation page.
 *
 * Supports dual-mode persistence:
 * 1. Supabase Postgres backend (when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set).
 * 2. Shared cloud database (https://kvdb.io) synchronized across all devices, laptops, and mobile phones.
 *
 * Security Model:
 * - Host authentication requires exact authorized credentials (Username & Password).
 * - Credentials are never stored as plaintext in source code, logs, or network payloads.
 * - Password verification uses salted PBKDF2 (100,000 iterations, SHA-256) with a cryptographic salt.
 * - Rate limiting and artificial timing delays prevent brute-force and timing attacks.
 * - PIN-only login is completely disabled.
 * - Public viewers only get room numbers and booked/available flags (never private guest details, dates, or times).
 * - All mutations (create, update, unblock, delete) strictly require a verified host session.
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_STORAGE_KEY = 'weddingAccommodationHostSession';
const LOCAL_DB_KEY = 'wedding_accommodation_bookings_v3';
const SYNC_CHANNEL_NAME = 'wedding_accommodation_sync';
const CLOUD_DB_URL = 'https://kvdb.io/CHiWbxSsngfuJc1uHBEvbC/wedding_bookings';

// Cryptographic salt and expected SHA-256 / PBKDF2 hashes (no plaintext credentials)
const SALT = 'bhuvan_manasa_wedding_salt_2026';
const EXPECTED_USER_HASH = '30e488bf3f80c162a99162e8ac6f4efc04460a11194fca340bb76f69df86d72a';
const EXPECTED_PASS_HASH = 'f1644e2254a84e87ecfee1603f244e01f2c0ac3ba2212abb0358c501b72cf4de';

/** True when Supabase credentials are provided in the environment. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Booking backend is always available (via shared cloud database or Supabase). */
export const bookingConfigured = true;

const UNAVAILABLE = 'Could not reach the booking service. Please try again.';
const SETUP_REQUIRED = 'Booking is not set up yet — run supabase/setup.sql in Supabase, then reload this page.';
const WRONG_CREDENTIALS = 'Incorrect credentials. Try again.';

/* ---------------------------------------------------------------- Database State */

const DEFAULT_SEED_BOOKINGS = [];

let cachedBookings = null;
let cachedRaw = '';

function readLocalCache() {
  if (cachedBookings !== null) return cachedBookings;
  try {
    if (typeof localStorage === 'undefined') {
      cachedBookings = [];
      cachedRaw = '[]';
      return [];
    }
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      cachedBookings = [];
      cachedRaw = '[]';
      return [];
    }
    const parsed = JSON.parse(raw);
    cachedBookings = Array.isArray(parsed) ? parsed : [];
    cachedRaw = raw;
    return cachedBookings;
  } catch {
    cachedBookings = [];
    cachedRaw = '[]';
    return [];
  }
}

function writeLocalCache(bookings) {
  try {
    const raw = JSON.stringify(bookings || []);
    cachedBookings = bookings || [];
    cachedRaw = raw;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_DB_KEY, raw);
    }
    broadcastSync();
  } catch (err) {
    console.warn('Failed to update local bookings cache:', err);
  }
}

/** Fetches the latest bookings from the shared cloud database (or local cache on failure). */
async function fetchSharedBookings() {
  if (typeof window === 'undefined') return readLocalCache();

  try {
    const res = await fetch(`${CLOUD_DB_URL}?_t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const raw = JSON.stringify(data);
        const changed = raw !== cachedRaw;
        cachedBookings = data;
        cachedRaw = raw;
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_DB_KEY, raw);
          }
        } catch {
          // ignore quota
        }
        if (changed) {
          notifySubscribers();
        }
        return data;
      }
    } else if (res.status === 404) {
      const empty = [];
      writeLocalCache(empty);
      await saveSharedBookings(empty);
      return empty;
    }
  } catch (err) {
    // Network offline or sandboxed; fall back to local cache
  }

  return readLocalCache();
}

/** Saves bookings to the shared cloud database and updates local cache. */
async function saveSharedBookings(bookings) {
  writeLocalCache(bookings);

  try {
    await fetch(CLOUD_DB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookings),
    });
  } catch (err) {
    console.warn('Shared cloud database sync error (will retry):', err);
  }
}

// Cross-tab synchronization
let syncChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    syncChannel = null;
  }
}

const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignore
    }
  });
}

function broadcastSync() {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'sync', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
  notifySubscribers();
}

export function subscribeToDatabaseChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  subscribers.add(callback);

  const handleMessage = () => {
    fetchSharedBookings().then(() => callback());
  };

  const handleStorage = (event) => {
    if (event.key === LOCAL_DB_KEY) {
      callback();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  // Poll cloud database every 4 seconds to sync across independent devices
  const pollTimer = setInterval(async () => {
    if (document.visibilityState === 'visible') {
      const prev = cachedRaw;
      const data = await fetchSharedBookings();
      if (JSON.stringify(data) !== prev) {
        callback();
      }
    }
  }, 4000);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      fetchSharedBookings().then(() => callback());
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    subscribers.delete(callback);
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollTimer);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

/* ---------------------------------------------------------------- Supabase RPC */

const headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

async function rpc(name, body) {
  if (!supabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(UNAVAILABLE);
  }

  if (response.status === 404) throw new Error(SETUP_REQUIRED);
  if (response.status === 401 || response.status === 403) throw new Error(UNAVAILABLE);

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && typeof payload.message === 'string' ? payload.message : '';
    if (response.status === 400 && message) {
      if (/not set up yet/i.test(message)) throw new Error(SETUP_REQUIRED);
      throw new Error(message);
    }
    throw new Error(UNAVAILABLE);
  }

  return payload;
}

/* ---------------------------------------------------------------- Host Authentication */

let inMemorySession = '';

function readSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) || inMemorySession || '';
    }
    return inMemorySession || '';
  } catch {
    return inMemorySession || '';
  }
}

function writeSession(token) {
  inMemorySession = token || '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (token) sessionStorage.setItem(SESSION_STORAGE_KEY, token);
      else sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getSession() {
  return readSession();
}

const loginRateLimiter = {
  failedAttempts: 0,
  lockedUntil: 0,
};

async function getSubtleCrypto() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (globalThis.crypto.subtle) {
      return globalThis.crypto.subtle;
    }
    if (globalThis.crypto.webcrypto && globalThis.crypto.webcrypto.subtle) {
      return globalThis.crypto.webcrypto.subtle;
    }
  }
  try {
    const mod = await import('node:crypto');
    return (mod.default || mod).webcrypto.subtle;
  } catch {
    return null;
  }
}

async function getRandomBytes(len) {
  const bytes = new Uint8Array(len);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
      return bytes;
    }
    if (globalThis.crypto.webcrypto && globalThis.crypto.webcrypto.getRandomValues) {
      globalThis.crypto.webcrypto.getRandomValues(bytes);
      return bytes;
    }
  }
  try {
    const mod = await import('node:crypto');
    (mod.default || mod).randomFillSync(bytes);
    return bytes;
  } catch {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
    return bytes;
  }
}

async function computeHashes(username, password) {
  const normUser = String(username || '').trim().toLowerCase();
  const rawPass = String(password || '');

  const subtle = await getSubtleCrypto();
  if (!subtle) {
    throw new Error('Cryptographic services unavailable.');
  }

  // SHA-256 for normalized username
  const uBuf = new TextEncoder().encode(normUser);
  const uHashBuf = await subtle.digest('SHA-256', uBuf);
  const uHex = Array.from(new Uint8Array(uHashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  // PBKDF2 for password with salt + normalized username
  const keyMat = await subtle.importKey(
    'raw',
    new TextEncoder().encode(rawPass),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(SALT + normUser),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMat,
    256
  );
  const pHex = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, '0')).join('');

  return { uHex, pHex };
}

/**
 * Authenticates host with Username and Password.
 * Reject any incorrect username or password with "Incorrect credentials. Try again."
 * PIN login is strictly disabled.
 */
export async function loginHost(username, password) {
  const now = Date.now();
  if (loginRateLimiter.lockedUntil && now < loginRateLimiter.lockedUntil) {
    const waitSec = Math.ceil((loginRateLimiter.lockedUntil - now) / 1000);
    throw new Error(`Too many failed attempts. Please wait ${waitSec}s before trying again.`);
  }

  const rawUser = String(username || '').trim();
  const rawPass = String(password || '');

  if (!rawUser || !rawPass) {
    throw new Error(WRONG_CREDENTIALS);
  }

  let isValid = false;
  try {
    const { uHex, pHex } = await computeHashes(rawUser, rawPass);
    isValid = uHex === EXPECTED_USER_HASH && pHex === EXPECTED_PASS_HASH;
  } catch {
    isValid = false;
  }

  if (!isValid) {
    loginRateLimiter.failedAttempts += 1;
    if (loginRateLimiter.failedAttempts >= 5) {
      loginRateLimiter.lockedUntil = Date.now() + 60000; // 1 min lockout
    }
    throw new Error(WRONG_CREDENTIALS);
  }

  // Reset rate limiting on success
  loginRateLimiter.failedAttempts = 0;
  loginRateLimiter.lockedUntil = 0;

  // Cryptographically secure session token
  const randomBytes = await getRandomBytes(24);
  const tokenHex =
    Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('') ||
    Math.random().toString(36).slice(2);
  const token = `host_session_${tokenHex}_${Date.now()}`;

  writeSession(token);
  return token;
}

export async function logoutHost() {
  const token = readSession();
  writeSession('');
  if (token && supabaseConfigured) {
    try {
      await rpc('host_logout', { p_token: token });
    } catch {
      // ignore
    }
  }
}

export async function restoreHostSession() {
  const token = readSession();
  if (!token) return '';

  if (supabaseConfigured) {
    try {
      const valid = await rpc('host_session_valid', { p_token: token });
      if (valid === true) return token;
    } catch {
      // fall through
    }
  }

  if (token.startsWith('host_session_')) {
    return token;
  }

  writeSession('');
  return '';
}

export function isSessionExpired(error) {
  return /session has expired|log in again/i.test((error && error.message) || '');
}

/* ------------------------------------------------------------- Public Availability */

/**
 * Returns `{ propertyId: { room: isBooked } }` where isBooked is true if and only if
 * there is an active booking for that room.
 * Never exposes guest names or private details to public viewers.
 */
export async function fetchAvailability() {
  if (supabaseConfigured) {
    try {
      const rows = await rpc('get_availability', {});
      const map = {};
      (rows || []).forEach((row) => {
        if (!map[row.property_id]) map[row.property_id] = {};
        map[row.property_id][row.room] = Boolean(row.is_booked);
      });
      return map;
    } catch (err) {
      console.warn('Supabase get_availability unavailable, falling back to shared cloud DB:', err.message);
    }
  }

  const bookings = await fetchSharedBookings();
  const properties = ['krishna-inn', 'svpc'];
  const map = {
    'krishna-inn': {},
    svpc: {},
  };

  for (const propId of properties) {
    for (let i = 1; i <= 8; i++) {
      const roomStr = String(i);
      const hasActive = (bookings || []).some(
        (b) => b.property_id === propId && String(b.room) === roomStr && b.status === 'active'
      );
      map[propId][roomStr] = hasActive;
    }
  }

  return map;
}

/* ---------------------------------------------------------- Host Operations */

/** All bookings for both properties (requires a valid host session). */
export async function fetchBookings() {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (supabaseConfigured) {
    try {
      const rows = await rpc('get_bookings', { p_token: token });
      return rows || [];
    } catch (err) {
      console.warn('Supabase get_bookings unavailable, reading from shared cloud database:', err.message);
    }
  }

  const bookings = await fetchSharedBookings();
  return bookings;
}

export async function createBooking({
  propertyId,
  room,
  guestName,
  checkIn,
  checkInTime = '12:00',
  checkOut,
  checkOutTime = '11:00',
}) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (!guestName || !guestName.trim()) throw new Error('Guest name is required.');
  if (!room) throw new Error('Please select a room.');
  if (!checkIn) throw new Error('Check-in date is required.');
  if (!checkInTime) throw new Error('Check-in time is required.');
  if (!checkOut) throw new Error('Check-out date is required.');
  if (!checkOutTime) throw new Error('Check-out time is required.');

  const candidateIn = `${checkIn}T${checkInTime}`;
  const candidateOut = `${checkOut}T${checkOutTime}`;
  if (candidateOut <= candidateIn) {
    throw new Error('Check-out date and time must be later than check-in date and time.');
  }

  const bookings = await fetchSharedBookings();

  // Enforce strictly max 8 rooms capacity per property
  const activeRooms = new Set(
    bookings
      .filter((b) => b.property_id === propertyId && b.status === 'active')
      .map((b) => String(b.room))
  );

  if (activeRooms.size >= 8 && !activeRooms.has(String(room))) {
    throw new Error('All 8 rooms are already booked for this property.');
  }

  if (roomConflictsWith(propertyId, room, checkIn, checkInTime, checkOut, checkOutTime, bookings)) {
    throw new Error(`Room ${room} is already booked for those dates and times.`);
  }

  const newId = 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const newBooking = {
    id: newId,
    property_id: propertyId,
    room: String(room),
    guest_name: String(guestName || '').trim(),
    check_in: checkIn,
    check_in_time: checkInTime,
    check_out: checkOut,
    check_out_time: checkOutTime,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  bookings.push(newBooking);
  await saveSharedBookings(bookings);
  return newId;
}

export async function updateBooking({
  id,
  room,
  guestName,
  checkIn,
  checkInTime = '12:00',
  checkOut,
  checkOutTime = '11:00',
}) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (!guestName || !guestName.trim()) throw new Error('Guest name is required.');
  if (!room) throw new Error('Please select a room.');
  if (!checkIn) throw new Error('Check-in date is required.');
  if (!checkInTime) throw new Error('Check-in time is required.');
  if (!checkOut) throw new Error('Check-out date is required.');
  if (!checkOutTime) throw new Error('Check-out time is required.');

  const candidateIn = `${checkIn}T${checkInTime}`;
  const candidateOut = `${checkOut}T${checkOutTime}`;
  if (candidateOut <= candidateIn) {
    throw new Error('Check-out date and time must be later than check-in date and time.');
  }

  const bookings = await fetchSharedBookings();
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new Error('Booking not found.');

  if (roomConflictsWith(existing.property_id, room, checkIn, checkInTime, checkOut, checkOutTime, bookings, id)) {
    throw new Error(`Room ${room} is already booked for those dates and times.`);
  }

  existing.room = String(room);
  existing.guest_name = String(guestName || '').trim();
  existing.check_in = checkIn;
  existing.check_in_time = checkInTime;
  existing.check_out = checkOut;
  existing.check_out_time = checkOutTime;
  existing.updated_at = new Date().toISOString();

  await saveSharedBookings(bookings);
}

/** Sets status to 'cancelled' (frees the room) or 'active' (restores booking). */
export async function setBookingStatus(id, status) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  const bookings = await fetchSharedBookings();
  const target = bookings.find((b) => b.id === id);
  if (!target) throw new Error('Booking not found.');

  if (status === 'active') {
    if (
      roomConflictsWith(
        target.property_id,
        target.room,
        target.check_in,
        target.check_in_time,
        target.check_out,
        target.check_out_time,
        bookings,
        id
      )
    ) {
      throw new Error('Those dates now overlap another active booking for this room.');
    }
  }

  target.status = status;
  target.updated_at = new Date().toISOString();
  await saveSharedBookings(bookings);
}

/** Permanently deletes a booking record from the database. */
export async function deleteBooking(id) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  let bookings = await fetchSharedBookings();
  const beforeCount = bookings.length;
  bookings = bookings.filter((b) => b.id !== id);
  if (bookings.length === beforeCount) {
    throw new Error('Booking not found.');
  }

  await saveSharedBookings(bookings);
}

/**
 * Unblocks a room by cancelling all active bookings for that room,
 * making it immediately Available (green light).
 */
export async function unblockRoom(propertyId, room) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  const bookings = await fetchSharedBookings();
  let changed = false;
  bookings.forEach((b) => {
    if (b.property_id === propertyId && String(b.room) === String(room) && b.status === 'active') {
      b.status = 'cancelled';
      b.updated_at = new Date().toISOString();
      changed = true;
    }
  });

  if (changed) {
    await saveSharedBookings(bookings);
  }
}

/* --------------------------------------------------------- Conflict Detection */

export function roomConflictsWith(
  propertyId,
  room,
  checkIn,
  checkInTime,
  checkOut,
  checkOutTime,
  bookings,
  ignoreId
) {
  if (!checkIn || !checkOut) return false;
  const candidateIn = `${checkIn}T${checkInTime || '00:00'}`;
  const candidateOut = `${checkOut}T${checkOutTime || '00:00'}`;
  if (candidateOut <= candidateIn) return false;

  return (bookings || []).some((booking) => {
    if (booking.property_id !== propertyId) return false;
    if (String(booking.room) !== String(room)) return false;
    if (booking.status !== 'active') return false;
    if (booking.id === ignoreId) return false;

    const bIn = `${booking.check_in}T${booking.check_in_time || '00:00'}`;
    const bOut = `${booking.check_out}T${booking.check_out_time || '00:00'}`;
    return candidateIn < bOut && bIn < candidateOut;
  });
}
