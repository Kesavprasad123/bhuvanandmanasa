/**
 * Accommodation properties for the wedding stay page.
 *
 * This file only holds PUBLIC information: property names, blurbs, map links
 * and the room inventory (`accommodation.xlsx`, worksheets "Krishna-In" and
 * "SVPC" — 8 rooms per property).
 *
 * Guest bookings (names, check-in / check-out dates) live in Supabase and are
 * delivered only to the authenticated host — they are never part of this
 * bundle. See `src/data/bookingStore.js` and `supabase/setup.sql`.
 */

export const PROPERTIES = [
  {
    id: 'krishna-inn',
    name: 'Krishna Inn',
    sheet: 'Krishna-In',
    blurb: 'Rooms reserved for our family and wedding guests.',
    address: null,
    // Verified Google Maps link for Krishna Inn.
    mapUrl:
      'https://www.google.com/maps/place/KRISHNA+INN/@17.0014322,81.7789812,15.43z/data=!4m9!3m8!1s0x3a37a3c32a1391cd:0x54b963c115fb69b1!5m2!4m1!1i2!8m2!3d17.0069703!4d81.790074!16s%2Fg%2F11rf6ly2tb?entry=ttu',
    rooms: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
  {
    id: 'svpc',
    name: 'SVPC',
    sheet: 'SVPC',
    blurb: 'Rooms reserved for our friends and wedding guests.',
    address: null,
    // Verified map link already used by the venue section of the invitation.
    mapUrl:
      'https://www.google.com/maps/place/SVPC+CONVENTIONS/@17.0438279,81.794505,12.69z/data=!4m6!3m5!1s0x3a37a173580ba0c1:0xf660ea509c425358!8m2!3d17.0387557!4d81.8332866!16s%2Fg%2F11nz344pws?entry=ttu',
    rooms: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
];

export const getProperty = (id) => PROPERTIES.find((property) => property.id === id) || null;
