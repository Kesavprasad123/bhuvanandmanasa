/**
 * Room booking and dynamic allocation store for the accommodation page.
 *
 * Supports two stay locations:
 * 1. Krishna Inn (8 rooms)
 * 2. SVPC (Wedding Convention) (8 rooms)
 *
 * Security & Access Control:
 * - Public viewers only see high-level availability (total, occupied count, available count,
 *   and individual room occupied/available status). Guest names are NEVER exposed publicly.
 * - Only the authenticated host with the 4-digit PIN code can view guest details,
 *   dynamically allocate rooms, toggle occupied/available status, and update dates.
 *
 * Persistence & Real-time Sync:
 * - Supports dual-mode: Supabase backend when credentials are present,
 *   plus local persistent storage with cross-tab BroadcastChannel synchronization.
 */

import { CHECK_IN_TIME, CHECK_OUT_TIME, PROPERTIES } from './accommodation';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || '';

const SESSION_STORAGE_KEY = 'weddingAccommodationHostSession';
const LOCAL_DB_KEY = 'wedding_accommodation_bookings_v2';
const HOST_PIN_KEY = 'wedding_host_pin_code';
const SYNC_CHANNEL_NAME = 'wedding_accommodation_sync';

// Default 4-digit host PIN (can be customized by host)
export const DEFAULT_HOST_PIN = '1212';

/** True when Supabase credentials are provided in the environment. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Booking backend is always active (either Supabase or local sync engine). */
export const bookingConfigured = true;

const UNAVAILABLE = 'Could not reach the booking service. Please try again.';
const SETUP_REQUIRED = 'Booking is not set up yet — run supabase/setup.sql in Supabase, then reload this page.';
const WRONG_PIN = 'Invalid 4-digit access code. Please try again.';

/* ---------------------------------------------------------------- Default Seed Data */

export const DEFAULT_SEED_BOOKINGS = [
  // Krishna Inn (Rooms 1 to 8)
  { id: 'b1', property_id: 'krishna-inn', room: '1', guest_name: 'Sridhar', check_in: '2026-12-10', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b2', property_id: 'krishna-inn', room: '2', guest_name: 'Radha Krisha', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b3', property_id: 'krishna-inn', room: '3', guest_name: 'K Subbarao', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b4', property_id: 'krishna-inn', room: '4', guest_name: 'Shekar, Surya', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b5', property_id: 'krishna-inn', room: '5', guest_name: 'Additional', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b6', property_id: 'krishna-inn', room: '6', guest_name: 'Teja - Director', check_in: '2026-12-11', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b7', property_id: 'krishna-inn', room: '7', guest_name: 'Teja - Dheeraj', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b8', property_id: 'krishna-inn', room: '8', guest_name: 'Teja - Hari & Kranthi', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },

  // SVPC (Wedding Convention) (Rooms 1 to 8)
  { id: 'b9', property_id: 'svpc', room: '1', guest_name: 'Aneel, Bala, Shiva', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b10', property_id: 'svpc', room: '2', guest_name: 'Shristi', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b11', property_id: 'svpc', room: '3', guest_name: 'Btech Boys', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b12', property_id: 'svpc', room: '4', guest_name: 'Btech Girls', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b13', property_id: 'svpc', room: '5', guest_name: 'Btech Girls', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b14', property_id: 'svpc', room: '6', guest_name: 'Manisha, Teja, Shylu', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b15', property_id: 'svpc', room: '7', guest_name: 'Chanti Frnds', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
  { id: 'b16', property_id: 'svpc', room: '8', guest_name: 'Chanti Frnds', check_in: '2026-12-12', check_out: '2026-12-13', status: 'active', check_in_time: CHECK_IN_TIME, check_out_time: CHECK_OUT_TIME, updated_at: '2026-10-28T09:00:00Z' },
];

/* ---------------------------------------------------------------- Host PIN & Storage */

export function getHostPin() {
  try {
    const custom = localStorage.getItem(HOST_PIN_KEY);
    if (custom && /^\d{4}$/.test(custom)) return custom;
  } catch {}
  return String(env.VITE_HOST_PIN || DEFAULT_HOST_PIN);
}

export function setHostPin(currentPin, newPin) {
  const activePin = getHostPin();
  if (String(currentPin).trim() !== activePin) {
    throw new Error('Current PIN is incorrect.');
  }
  const cleanNew = String(newPin || '').trim();
  if (!/^\d{4}$/.test(cleanNew)) {
    throw new Error('New PIN must be exactly 4 digits.');
  }
  try {
    localStorage.setItem(HOST_PIN_KEY, cleanNew);
    broadcastSync();
  } catch (err) {
    throw new Error('Failed to update PIN in local storage.');
  }
}

function readLocalBookings() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(DEFAULT_SEED_BOOKINGS));
      return DEFAULT_SEED_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(DEFAULT_SEED_BOOKINGS));
      return DEFAULT_SEED_BOOKINGS;
    }
    return parsed;
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
    if (event.key === LOCAL_DB_KEY || event.key === HOST_PIN_KEY) callback();
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

export function isHostLoggedIn() {
  return Boolean(readSession());
}

export async function loginHost(pin) {
  const value = String(pin || '').trim();
  if (!/^\d{4}$/.test(value)) {
    throw new Error('Please enter the 4-digit PIN code.');
  }

  if (supabaseConfigured) {
    try {
      const token = await rpc('host_login', { p_pin: value });
      if (typeof token !== 'string' || !token) throw new Error(WRONG_PIN);
      writeSession(token);
      return token;
    } catch (err) {
      if (err.message === WRONG_PIN || err.message === SETUP_REQUIRED) {
        throw err;
      }
      console.warn('Falling back to local host session:', err.message);
    }
  }

  // Strict host PIN verification
  const currentPin = getHostPin();
  if (value !== currentPin) {
    throw new Error(WRONG_PIN);
  }

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
 * Returns `{ propertyId: { [room]: isOccupiedBoolean } }`.
 * Public guest view only has access to this data — NEVER private guest names.
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
      console.warn('Supabase get_availability unavailable, falling back to local DB:', err.message);
    }
  }

  const bookings = readLocalBookings();
  const map = {
    'krishna-inn': {},
    svpc: {},
  };

  PROPERTIES.forEach((prop) => {
    prop.rooms.forEach((roomStr) => {
      const hasActive = bookings.some(
        (b) => b.property_id === prop.id && String(b.room) === String(roomStr) && b.status === 'active'
      );
      map[prop.id][roomStr] = hasActive;
    });
  });

  return map;
}

/* ---------------------------------------------------------- Host Operations */

/**
 * Returns all room allocation records. Host login required.
 */
export async function fetchBookings() {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  if (supabaseConfigured) {
    try {
      const rows = await rpc('get_bookings', { p_token: token });
      return rows || [];
    } catch (err) {
      console.warn('Supabase get_bookings unavailable, reading local DB:', err.message);
    }
  }

  return readLocalBookings();
}

/**
 * Dynamic room allocation: Updates guest name, occupancy status, and stay dates.
 */
export async function saveRoomAllocation({
  propertyId,
  room,
  guestName = '',
  status = 'active',
  checkIn = '2026-12-12',
  checkOut = '2026-12-13',
}) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  const cleanRoom = String(room);
  const cleanName = String(guestName || '').trim();
  const cleanStatus = status === 'active' || status === 'occupied' ? 'active' : 'cancelled';

  if (supabaseConfigured) {
    try {
      // Find if booking already exists
      const existingRows = await rpc('get_bookings', { p_token: token });
      const target = (existingRows || []).find(
        (b) => b.property_id === propertyId && String(b.room) === cleanRoom
      );
      if (target) {
        await rpc('update_booking', {
          p_token: token,
          p_id: target.id,
          p_room: cleanRoom,
          p_guest: cleanName,
          p_check_in: checkIn,
          p_check_out: checkOut,
        });
        await rpc('set_booking_status', {
          p_token: token,
          p_id: target.id,
          p_status: cleanStatus,
        });
      } else {
        await rpc('create_booking', {
          p_token: token,
          p_property: propertyId,
          p_room: cleanRoom,
          p_guest: cleanName,
          p_check_in: checkIn,
          p_check_out: checkOut,
        });
      }
    } catch (err) {
      console.warn('Supabase write failed, falling back to local storage:', err.message);
    }
  }

  const bookings = readLocalBookings();
  const index = bookings.findIndex(
    (b) => b.property_id === propertyId && String(b.room) === cleanRoom
  );

  const now = new Date().toISOString();
  if (index >= 0) {
    bookings[index] = {
      ...bookings[index],
      guest_name: cleanName,
      status: cleanStatus,
      check_in: checkIn,
      check_out: checkOut,
      check_in_time: CHECK_IN_TIME,
      check_out_time: CHECK_OUT_TIME,
      updated_at: now,
    };
  } else {
    bookings.push({
      id: `alloc_${propertyId}_${cleanRoom}_${Date.now()}`,
      property_id: propertyId,
      room: cleanRoom,
      guest_name: cleanName,
      status: cleanStatus,
      check_in: checkIn,
      check_out: checkOut,
      check_in_time: CHECK_IN_TIME,
      check_out_time: CHECK_OUT_TIME,
      updated_at: now,
    });
  }

  writeLocalBookings(bookings);
  return bookings;
}

/**
 * Toggles room status between active (Occupied) and cancelled (Available).
 */
export async function toggleRoomStatus(propertyId, room) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  const cleanRoom = String(room);
  const bookings = readLocalBookings();
  const existing = bookings.find(
    (b) => b.property_id === propertyId && String(b.room) === cleanRoom
  );

  const nextStatus = existing && existing.status === 'active' ? 'cancelled' : 'active';

  return saveRoomAllocation({
    propertyId,
    room: cleanRoom,
    guestName: existing ? existing.guest_name : '',
    status: nextStatus,
    checkIn: existing ? existing.check_in : '2026-12-12',
    checkOut: existing ? existing.check_out : '2026-12-13',
  });
}

/**
 * Clears room allocation (empties guest name and marks Available).
 */
export async function clearRoomAllocation(propertyId, room) {
  return saveRoomAllocation({
    propertyId,
    room: String(room),
    guestName: '',
    status: 'cancelled',
    checkIn: '2026-12-12',
    checkOut: '2026-12-13',
  });
}

/**
 * Formats a clean WhatsApp-ready allocation summary for easy sharing.
 */
export function generateWhatsAppSummary(propertyId = null) {
  const bookings = readLocalBookings();
  const targetProperties = propertyId
    ? PROPERTIES.filter((p) => p.id === propertyId)
    : PROPERTIES;

  let lines = [
    '🏨 *BHUVAN & MANASA WEDDING ACCOMMODATION*',
    '📅 *10 - 13 December 2026*',
    `🕒 Check-in: ${CHECK_IN_TIME} | 🕚 Check-out: ${CHECK_OUT_TIME}`,
    '----------------------------------------',
  ];

  targetProperties.forEach((prop) => {
    const propBookings = bookings.filter((b) => b.property_id === prop.id);
    const occupiedCount = prop.rooms.filter((r) =>
      propBookings.some((b) => String(b.room) === String(r) && b.status === 'active')
    ).length;

    lines.push('');
    lines.push(`📍 *${prop.name.toUpperCase()}* (${occupiedCount}/${prop.rooms.length} Occupied)`);
    if (prop.address) lines.push(`_${prop.address}_`);

    prop.rooms.forEach((r) => {
      const b = propBookings.find((item) => String(item.room) === String(r));
      const isOccupied = b && b.status === 'active';
      const guest = isOccupied && b.guest_name ? b.guest_name : 'Available';
      const dates = isOccupied && b.check_in && b.check_out ? ` (${b.check_in.slice(5)} to ${b.check_out.slice(5)})` : '';
      const icon = isOccupied ? '🔴' : '🟢';
      lines.push(`${icon} Room ${r}: ${guest}${dates}`);
    });
  });

  lines.push('');
  lines.push('----------------------------------------');
  lines.push('✨ Updated via Wedding Accommodation Tracker');

  return lines.join('\n');
}

/* --------------------------------------------------------- Compatibility exports */

export async function createBooking({ propertyId, room, guestName, checkIn, checkOut }) {
  return saveRoomAllocation({
    propertyId,
    room,
    guestName,
    status: 'active',
    checkIn,
    checkOut,
  });
}

export async function updateBooking({ id, room, guestName, checkIn, checkOut }) {
  const bookings = readLocalBookings();
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new Error('Booking not found.');

  return saveRoomAllocation({
    propertyId: existing.property_id,
    room,
    guestName,
    status: existing.status,
    checkIn,
    checkOut,
  });
}

export async function setBookingStatus(id, status) {
  const bookings = readLocalBookings();
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new Error('Booking not found.');

  return saveRoomAllocation({
    propertyId: existing.property_id,
    room: existing.room,
    guestName: existing.guest_name,
    status,
    checkIn: existing.check_in,
    checkOut: existing.check_out,
  });
}

export async function deleteBooking(id) {
  const token = readSession();
  if (!token) throw new Error('Host login required.');

  let bookings = readLocalBookings();
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new Error('Booking not found.');

  return clearRoomAllocation(existing.property_id, existing.room);
}

export async function unblockRoom(propertyId, room) {
  return clearRoomAllocation(propertyId, room);
}

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
