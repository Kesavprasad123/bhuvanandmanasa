/**
 * Room booking store for the accommodation page (Supabase backend).
 *
 * Everything flows through Postgres functions defined in `supabase/setup.sql`:
 *
 *   public (no login):
 *     fetchAvailability()      room numbers + booked flags only, no guest data
 *
 *   host (session token obtained by loginHost, verified SERVER SIDE on every
 *   call — nothing is trusted in the browser):
 *     loginHost / logoutHost / restoreHostSession
 *     fetchBookings / createBooking / updateBooking / setBookingStatus
 *
 * The four-digit access code is only ever sent to `host_login`; afterwards the
 * browser holds a random 12-hour session token instead. Guest names and dates
 * are returned exclusively by functions that re-check that token in the
 * database, so inspecting this file grants no access.
 */

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_STORAGE_KEY = 'weddingAccommodationHostSession';

/** True when the booking backend is configured for this build. */
export const bookingConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

const UNAVAILABLE = 'Could not reach the booking service. Please try again.';
const SETUP_REQUIRED = 'Booking is not set up yet — run supabase/setup.sql in Supabase, then reload this page.';
const WRONG_CODE = 'That access code is incorrect. Please try again.';

const headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

async function rpc(name, body) {
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

  // Functions returning VOID answer 204 with an empty body — never assume JSON.
  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    // RAISE EXCEPTION from our functions comes back as HTTP 400 + message.
    const message = payload && typeof payload.message === 'string' ? payload.message : '';
    if (response.status === 400 && message) {
      if (/not set up yet/i.test(message)) throw new Error(SETUP_REQUIRED);
      throw new Error(message);
    }
    throw new Error(UNAVAILABLE);
  }

  return payload;
}

/* ---------------------------------------------------------------- sessions */

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
    /* storage unavailable — the session simply won't survive a refresh */
  }
}

/** The stored host session token ('' when logged out). */
export function getSession() {
  return readSession();
}

/** Verifies the four-digit access code on the server and stores the session. */
export async function loginHost(pin) {
  const value = String(pin || '').trim();
  if (!/^\d{4}$/.test(value)) throw new Error('Please enter the four-digit access code.');

  const token = await rpc('host_login', { p_pin: value });
  if (typeof token !== 'string' || !token) throw new Error(WRONG_CODE);

  writeSession(token);
  return token;
}

/** Ends the host session on the server and clears it from this browser. */
export async function logoutHost() {
  const token = readSession();
  writeSession('');
  if (token && bookingConfigured) {
    try {
      await rpc('host_logout', { p_token: token });
    } catch {
      /* local session is cleared regardless; the token expires server side */
    }
  }
}

/** Re-validates a stored session after a refresh; clears it when expired. */
export async function restoreHostSession() {
  const token = readSession();
  if (!token || !bookingConfigured) return '';

  try {
    const valid = await rpc('host_session_valid', { p_token: token });
    if (valid === true) return token;
  } catch {
    /* fall through and clear */
  }
  writeSession('');
  return '';
}

/** True when an error means the host session is gone (re-login needed). */
export function isSessionExpired(error) {
  return /session has expired|log in again/i.test((error && error.message) || '');
}

/* ------------------------------------------------------------- public data */

/**
 * `{ propertyId: { room: isBooked } }` for every room in the inventory,
 * or `null` when the backend is not configured.
 */
export async function fetchAvailability() {
  if (!bookingConfigured) return null;
  const rows = await rpc('get_availability', {});

  const map = {};
  (rows || []).forEach((row) => {
    if (!map[row.property_id]) map[row.property_id] = {};
    map[row.property_id][row.room] = Boolean(row.is_booked);
  });
  return map;
}

/* ---------------------------------------------------------- host operations */

/** All bookings for both properties (requires a valid host session). */
export async function fetchBookings() {
  const rows = await rpc('get_bookings', { p_token: readSession() });
  return rows || [];
}

export async function createBooking({ propertyId, room, guestName, checkIn, checkOut }) {
  return rpc('create_booking', {
    p_token: readSession(),
    p_property: propertyId,
    p_room: String(room),
    p_guest: String(guestName || ''),
    p_check_in: checkIn,
    p_check_out: checkOut,
  });
}

export async function updateBooking({ id, room, guestName, checkIn, checkOut }) {
  await rpc('update_booking', {
    p_token: readSession(),
    p_id: id,
    p_room: String(room),
    p_guest: String(guestName || ''),
    p_check_in: checkIn,
    p_check_out: checkOut,
  });
}

/** 'cancelled' frees the room again; 'active' restores the booking. */
export async function setBookingStatus(id, status) {
  await rpc('set_booking_status', {
    p_token: readSession(),
    p_id: id,
    p_status: status,
  });
}

/** Permanently deletes a booking record (host only; irreversible). */
export async function deleteBooking(id) {
  await rpc('delete_booking', {
    p_token: readSession(),
    p_id: id,
  });
}

/**
 * Cancels every active booking for a room so it becomes Available again
 * (host only). Cancelled rows stay in the dashboard and can be Restored.
 */
export async function unblockRoom(propertyId, room) {
  await rpc('unblock_room', {
    p_token: readSession(),
    p_property: propertyId,
    p_room: String(room),
  });
}

/* --------------------------------------------------------- shared helpers */

/**
 * True when `room` already has an ACTIVE booking overlapping
 * [checkIn, checkOut) — used for inline hints; the server re-checks anyway.
 * ISO date strings compare correctly as plain strings.
 */
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
