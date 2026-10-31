/**
 * Accommodation properties for the wedding stay page.
 *
 * Two stay locations:
 * 1. Krishna Inn (Danavaipeta, Rajamahendravaram) - 8 rooms
 * 2. SVPC (Wedding Convention, Rajamahendravaram) - 8 rooms
 *
 * Check-in Time: 12:00 PM (Static)
 * Check-out Time: 11:00 AM (Static)
 */

export const CHECK_IN_TIME = '12:00 PM';
export const CHECK_OUT_TIME = '11:00 AM';

export const PROPERTIES = [
  {
    id: 'krishna-inn',
    name: 'Krishna Inn',
    shortName: 'Krishna Inn',
    sheet: 'Krishna-In',
    tagline: 'Family & Guests Stay',
    blurb: 'Comfortable rooms reserved for our beloved family and wedding guests.',
    address: 'Near Danavaipeta, Rajamahendravaram, Andhra Pradesh',
    // Verified Google Maps link for Krishna Inn
    mapUrl:
      'https://www.google.com/maps/place/KRISHNA+INN/@17.0014322,81.7789812,15.43z/data=!4m9!3m8!1s0x3a37a3c32a1391cd:0x54b963c115fb69b1!5m2!4m1!1i2!8m2!3d17.0069703!4d81.790074!16s%2Fg%2F11rf6ly2tb?entry=ttu',
    rooms: ['1', '2', '3', '4', '5', '6', '7', '8'],
    checkInTime: CHECK_IN_TIME,
    checkOutTime: CHECK_OUT_TIME,
  },
  {
    id: 'svpc',
    name: 'SVPC (Wedding Convention)',
    shortName: 'SVPC Convention',
    sheet: 'SVPC',
    tagline: 'Wedding Convention Hall & Stay',
    blurb: 'Comfortable rooms reserved for our friends and wedding guests right at the wedding venue.',
    address: 'SVPC Conventions, Rajamahendravaram, Andhra Pradesh',
    // Verified map link used by the venue section
    mapUrl:
      'https://www.google.com/maps/place/SVPC+CONVENTIONS/@17.0438279,81.794505,12.69z/data=!4m6!3m5!1s0x3a37a173580ba0c1:0xf660ea509c425358!8m2!3d17.0387557!4d81.8332866!16s%2Fg%2F11nz344pws?entry=ttu',
    rooms: ['1', '2', '3', '4', '5', '6', '7', '8'],
    checkInTime: CHECK_IN_TIME,
    checkOutTime: CHECK_OUT_TIME,
  },
];

export const getProperty = (id) => PROPERTIES.find((property) => property.id === id) || null;
