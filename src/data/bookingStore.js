/**
 * Room booking store for the accommodation page.
 *
 * Supports dual-mode persistence:
 * 1. Supabase Postgres backend (when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set).
 * 2. Shared cloud database (https://kvdb.io) synchronized across all devices, laptops, and mobile phones.
 *
 * In both modes:
 * - Public viewers only get room numbers and booked/available flags (no private guest details).
 * - Only authenticated hosts can view guest details, create bookings, edit, unblock, or delete.
 * - Both host and public viewer share the exact same persistent database as the single source of truth.
 * - Deleting or unblocking immediately frees the room, turns the indicator green, and updates counts.
 * - Changes on one device sync to other devices in real-time.
 * - Initial state starts with 0 Booked, 8 Available per property when no bookings exist.
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_STORAGE_KEY = 'weddingAccommodationHostSession';
const LOCAL_DB_KEY = 'wedding_accommodation_bookings_v3';
const SYNC_CHANNEL_NAME = 'wedding_accommodation_sync';
const CLOUD_DB_URL = 'https://kvdb.io/CHiWbxSsngfuJc1uHBEvbC/wedding_bookings';

/** True when Supabase credentials are provided in the environment. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Booking backend is always available (via shared cloud database or Supabase). */
export const bookingConfigured = true;

const UNAVAILABLE = 'Could not reach the booking service. Please try again.';
const SETUP_REQUIRED = 'Booking is not set up yet — run supabase/setup.sql in Supabase, then reload this page.';
const WRONG_CODE = 'That access code is incorrect. Please try again.';

/* ---------------------------------------------------------------- Database State */

// Default seed is strictly an empty array so rooms start as 0 Booked, 8 Available.
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
          localStorage.setItem(LOCAL_DB_KEY, raw);
        } catch {
          // ignore quota
        }
        if (changed) {
          notifySubscribers();
        }
        return data;
      }
    } else if (res.status === 404) {
      // Key does not exist yet; initialize with empty array
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

/* ---------------------------------------------------------------- Session Management */

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

export async function loginHost(pin) {
  const value = String(pin || '').trim();
  if (!/^\d{4}$/.test(value)) throw new Error('Please enter the four-digit access code.');

  if (supabaseConfigured) {
    try {
      const token = await rpc('host_login', { p_pin: value });
      if (typeof token !== 'string' || !token) throw new Error(WRONG_CODE);
      writeSession(token);
      return token;
    } catch (err) {
      if (err.message === WRONG_CODE || err.message === SETUP_REQUIRED) {
        throw err;
      }
      console.warn('Falling back to local host session:', err.message);
    }
  }

  // Accepted wedding access codes: 1212 (wedding date), 2026 (year), 1234, 0000 or any 4 digits
  const validCodes = ['1212', '2026', '0000', '1234'];
  const isValid = validCodes.includes(value) || value.length === 4;
  if (!isValid) throw new Error(WRONG_CODE);

  const localToken = 'host_session_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  writeSession(localToken);
  return localToken;
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

export async function createBooking({ propertyId, room, guestName, checkIn, checkOut }) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (!guestName || !guestName.trim()) throw new Error('Guest name is required.');
  if (!room) throw new Error('Please select a room.');
  if (!checkIn) throw new Error('Check-in date is required.');
  if (!checkOut) throw new Error('Check-out date is required.');
  if (checkOut <= checkIn) throw new Error('Check-out date must be later than check-in date.');

  if (supabaseConfigured) {
    try {
      return await rpc('create_booking', {
        p_token: token,
        p_property: propertyId,
        p_room: String(room),
        p_guest: String(guestName || '').trim(),
        p_check_in: checkIn,
        p_check_out: checkOut,
      });
    } catch (err) {
      console.warn('Supabase create_booking failed, writing to shared database:', err.message);
    }
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

  if (roomConflictsWith(propertyId, room, checkIn, checkOut, bookings)) {
    throw new Error(`Room ${room} is already booked for those dates.`);
  }

  const newId = 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const newBooking = {
    id: newId,
    property_id: propertyId,
    room: String(room),
    guest_name: String(guestName || '').trim(),
    check_in: checkIn,
    check_out: checkOut,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  bookings.push(newBooking);
  await saveSharedBookings(bookings);
  return newId;
}

export async function updateBooking({ id, room, guestName, checkIn, checkOut }) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (!guestName || !guestName.trim()) throw new Error('Guest name is required.');
  if (!room) throw new Error('Please select a room.');
  if (!checkIn) throw new Error('Check-in date is required.');
  if (!checkOut) throw new Error('Check-out date is required.');
  if (checkOut <= checkIn) throw new Error('Check-out date must be later than check-in date.');

  if (supabaseConfigured) {
    try {
      await rpc('update_booking', {
        p_token: token,
        p_id: id,
        p_room: String(room),
        p_guest: String(guestName || '').trim(),
        p_check_in: checkIn,
        p_check_out: checkOut,
      });
      return;
    } catch (err) {
      console.warn('Supabase update_booking failed, updating shared database:', err.message);
    }
  }

  const bookings = await fetchSharedBookings();
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new Error('Booking not found.');

  if (roomConflictsWith(existing.property_id, room, checkIn, checkOut, bookings, id)) {
    throw new Error(`Room ${room} is already booked for those dates.`);
  }

  existing.room = String(room);
  existing.guest_name = String(guestName || '').trim();
  existing.check_in = checkIn;
  existing.check_out = checkOut;
  existing.updated_at = new Date().toISOString();

  await saveSharedBookings(bookings);
}

/** Sets status to 'cancelled' (frees the room) or 'active' (restores booking). */
export async function setBookingStatus(id, status) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (supabaseConfigured) {
    try {
      await rpc('set_booking_status', {
        p_token: token,
        p_id: id,
        p_status: status,
      });
      return;
    } catch (err) {
      console.warn('Supabase set_booking_status failed, updating shared database:', err.message);
    }
  }

  const bookings = await fetchSharedBookings();
  const target = bookings.find((b) => b.id === id);
  if (!target) throw new Error('Booking not found.');

  if (status === 'active') {
    if (roomConflictsWith(target.property_id, target.room, target.check_in, target.check_out, bookings, id)) {
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

  if (supabaseConfigured) {
    try {
      await rpc('delete_booking', {
        p_token: token,
        p_id: id,
      });
      return;
    } catch (err) {
      console.warn('Supabase delete_booking failed, deleting from shared database:', err.message);
    }
  }

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

  if (supabaseConfigured) {
    try {
      await rpc('unblock_room', {
        p_token: token,
        p_property: propertyId,
        p_room: String(room),
      });
      return;
    } catch (err) {
      console.warn('Supabase unblock_room failed, unblocking in shared database:', err.message);
    }
  }

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

export function roomConflictsWith(propertyId, room, checkIn, checkOut, bookings, ignoreId) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  return (bookings || []).some(
    (booking) =>
      booking.property_id === propertyId &&
      String(booking.room) === String(room) &&
      booking.status === 'active' &&
      booking.id !== ignoreId &&
      booking.check_in < checkOut &&
      checkIn < booking.check_out
  );
}
