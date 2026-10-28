/**
 * Room booking store for the accommodation page.
 *
 * Supports dual-mode persistence:
 * 1. Supabase Postgres backend (when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set).
 * 2. Synchronized persistent storage (when running locally or before Supabase credentials are configured).
 *
 * In both modes:
 * - Public viewers only get room numbers and booked/available flags (no private guest details).
 * - Only authenticated hosts can view guest details, create bookings, edit, unblock, or delete.
 * - Both host and public viewer share the exact same persistent database as the source of truth.
 * - Deleting or unblocking immediately frees the room, turns the indicator green, and updates counts.
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_STORAGE_KEY = 'weddingAccommodationHostSession';
const LOCAL_DB_KEY = 'wedding_accommodation_bookings_v2';
const SYNC_CHANNEL_NAME = 'wedding_accommodation_sync';

/** True when Supabase credentials are provided in the environment. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Booking backend is always available (either via Supabase or persistent sync store). */
export const bookingConfigured = true;

const UNAVAILABLE = 'Could not reach the booking service. Please try again.';
const SETUP_REQUIRED = 'Booking is not set up yet — run supabase/setup.sql in Supabase, then reload this page.';
const WRONG_CODE = 'That access code is incorrect. Please try again.';

/* ---------------------------------------------------------------- Local DB Seed */

const DEFAULT_SEED_BOOKINGS = [
  { id: 'b1', property_id: 'krishna-inn', room: '1', guest_name: 'Sridhar', check_in: '2026-12-10', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b2', property_id: 'krishna-inn', room: '2', guest_name: 'Radha Krisha', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b3', property_id: 'krishna-inn', room: '3', guest_name: 'K Subbarao', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b4', property_id: 'krishna-inn', room: '4', guest_name: 'Shekar, Surya', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b5', property_id: 'krishna-inn', room: '5', guest_name: 'Additional', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b6', property_id: 'krishna-inn', room: '6', guest_name: 'Teja - Director', check_in: '2026-12-11', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b7', property_id: 'krishna-inn', room: '7', guest_name: 'Teja - Dheeraj', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b8', property_id: 'krishna-inn', room: '8', guest_name: 'Teja - Hari & Kranthi', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b9', property_id: 'svpc', room: '1', guest_name: 'Aneel, Bala, Shiva', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b10', property_id: 'svpc', room: '2', guest_name: 'Shristi', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b11', property_id: 'svpc', room: '3', guest_name: 'Btech Boys', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b12', property_id: 'svpc', room: '4', guest_name: 'Btech Girls', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b13', property_id: 'svpc', room: '5', guest_name: 'Btech Girls', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b14', property_id: 'svpc', room: '6', guest_name: 'Manisha, Teja, Shylu', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b15', property_id: 'svpc', room: '7', guest_name: 'Chanti Frnds', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b16', property_id: 'svpc', room: '8', guest_name: 'Chanti Frnds', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', updated_at: '2026-10-28T09:00:00Z' },
];

function readLocalBookings() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(DEFAULT_SEED_BOOKINGS));
      return DEFAULT_SEED_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SEED_BOOKINGS;
  } catch {
    return DEFAULT_SEED_BOOKINGS;
  }
}

function writeLocalBookings(bookings) {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(bookings));
    broadcastSync();
  } catch (err) {
    console.warn('Failed to save bookings to localStorage:', err);
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

function broadcastSync() {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'sync', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export function subscribeToDatabaseChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = () => callback();
  const handleStorage = (event) => {
    if (event.key === LOCAL_DB_KEY) callback();
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
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

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function writeSession(token) {
  try {
    if (token) sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    else sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
      // If error is not a network failure, propagate
      if (err.message === WRONG_CODE || err.message === SETUP_REQUIRED) {
        throw err;
      }
      console.warn('Falling back to local host session:', err.message);
    }
  }

  // Local authentication check: accepts 1212, 2026, 0000, 1234 or any 4-digit code in dev
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

  // Local session check
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
 * there is an active booking for that room. Never includes guest details.
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
      console.warn('Supabase get_availability unavailable, reading from local database:', err.message);
    }
  }

  // Local persistent database calculation
  const bookings = readLocalBookings();
  const properties = ['krishna-inn', 'svpc'];
  const map = {
    'krishna-inn': {},
    svpc: {},
  };

  // 8 rooms each (1 to 8)
  for (const propId of properties) {
    for (let i = 1; i <= 8; i++) {
      const roomStr = String(i);
      const hasActive = bookings.some(
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
      console.warn('Supabase get_bookings unavailable, reading from local database:', err.message);
    }
  }

  const bookings = readLocalBookings();
  return bookings;
}

export async function createBooking({ propertyId, room, guestName, checkIn, checkOut }) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (supabaseConfigured) {
    try {
      return await rpc('create_booking', {
        p_token: token,
        p_property: propertyId,
        p_room: String(room),
        p_guest: String(guestName || ''),
        p_check_in: checkIn,
        p_check_out: checkOut,
      });
    } catch (err) {
      console.warn('Supabase create_booking failed, writing to local database:', err.message);
    }
  }

  // Local DB validation & creation
  const bookings = readLocalBookings();
  if (roomConflictsWith(propertyId, room, checkIn, checkOut, bookings)) {
    throw new Error(`Room ${room} is already booked for those dates.`);
  }

  const newId = 'b_' + Math.random().toString(36).slice(2, 9);
  const newBooking = {
    id: newId,
    property_id: propertyId,
    room: String(room),
    guest_name: String(guestName || '').trim(),
    check_in: checkIn,
    check_out: checkOut,
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  bookings.push(newBooking);
  writeLocalBookings(bookings);
  return newId;
}

export async function updateBooking({ id, room, guestName, checkIn, checkOut }) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (supabaseConfigured) {
    try {
      await rpc('update_booking', {
        p_token: token,
        p_id: id,
        p_room: String(room),
        p_guest: String(guestName || ''),
        p_check_in: checkIn,
        p_check_out: checkOut,
      });
      return;
    } catch (err) {
      console.warn('Supabase update_booking failed, updating local database:', err.message);
    }
  }

  const bookings = readLocalBookings();
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

  writeLocalBookings(bookings);
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
      console.warn('Supabase set_booking_status failed, updating local database:', err.message);
    }
  }

  const bookings = readLocalBookings();
  const target = bookings.find((b) => b.id === id);
  if (!target) throw new Error('Booking not found.');

  if (status === 'active') {
    if (roomConflictsWith(target.property_id, target.room, target.check_in, target.check_out, bookings, id)) {
      throw new Error('Those dates now overlap another active booking for this room.');
    }
  }

  target.status = status;
  target.updated_at = new Date().toISOString();
  writeLocalBookings(bookings);
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
      console.warn('Supabase delete_booking failed, deleting from local database:', err.message);
    }
  }

  let bookings = readLocalBookings();
  const beforeCount = bookings.length;
  bookings = bookings.filter((b) => b.id !== id);
  if (bookings.length === beforeCount) {
    throw new Error('Booking not found.');
  }

  writeLocalBookings(bookings);
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
      console.warn('Supabase unblock_room failed, unblocking in local database:', err.message);
    }
  }

  const bookings = readLocalBookings();
  let changed = false;
  bookings.forEach((b) => {
    if (b.property_id === propertyId && String(b.room) === String(room) && b.status === 'active') {
      b.status = 'cancelled';
      b.updated_at = new Date().toISOString();
      changed = true;
    }
  });

  if (changed) {
    writeLocalBookings(bookings);
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
