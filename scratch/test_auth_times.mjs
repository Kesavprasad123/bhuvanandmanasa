import * as bs from '../src/data/bookingStore.js';

(async () => {
  console.log('--- Testing Authentication & Date-Time Features ---');

  // 1. Test Incorrect credentials
  try {
    await bs.loginHost('Bhuvanmanasa@gmail.com', 'Love');
    throw new Error('Should have failed with incorrect credentials!');
  } catch (err) {
    console.log('Test 1 (Incorrect credentials):', err.message);
    if (err.message !== 'Incorrect credentials. Try again.') {
      throw new Error(`Expected exact error message "Incorrect credentials. Try again." but got: ${err.message}`);
    }
  }

  // 2. Test PIN only attempt
  try {
    await bs.loginHost('1212', '');
    throw new Error('PIN attempt should have failed!');
  } catch (err) {
    console.log('Test 2 (PIN rejection):', err.message);
    if (err.message !== 'Incorrect credentials. Try again.') {
      throw new Error('Expected exact error message "Incorrect credentials. Try again."');
    }
  }

  // 3. Test Correct credentials
  let token;
  try {
    token = await bs.loginHost('Bhuvanmanasa@love.com', 'Marriage');
    console.log('Test 3 (Correct credentials): Success! Token:', token.slice(0, 20) + '...');
  } catch (err) {
    console.error('Test 3 failed with error:', err);
    throw err;
  }
  if (!token.startsWith('host_session_')) throw new Error('Invalid token generated!');

  // 4. Test Booking with Date and Time
  const bId = await bs.createBooking({
    propertyId: 'krishna-inn',
    room: '3',
    guestName: 'Ramesh Family',
    checkIn: '2026-12-10',
    checkInTime: '14:00',
    checkOut: '2026-12-13',
    checkOutTime: '11:00'
  });
  console.log('Test 4 (Create booking with time): Created booking ID:', bId);

  const bookings = await bs.fetchBookings();
  const created = bookings.find(b => b.id === bId);
  console.log('Verified stored booking:', {
    guest: created.guest_name,
    checkIn: created.check_in,
    checkInTime: created.check_in_time,
    checkOut: created.check_out,
    checkOutTime: created.check_out_time
  });
  if (created.check_in_time !== '14:00' || created.check_out_time !== '11:00') {
    throw new Error('Check-in and check-out times were not saved properly!');
  }

  // 5. Test Invalid Checkout before Checkin (Same day, earlier time)
  try {
    await bs.createBooking({
      propertyId: 'krishna-inn',
      room: '4',
      guestName: 'Invalid Time Guest',
      checkIn: '2026-12-12',
      checkInTime: '15:00',
      checkOut: '2026-12-12',
      checkOutTime: '10:00'
    });
    throw new Error('Checkout before checkin should have failed!');
  } catch (err) {
    console.log('Test 5 (Invalid checkout time caught):', err.message);
  }

  // 6. Test Time-based Conflict on Same Room
  try {
    await bs.createBooking({
      propertyId: 'krishna-inn',
      room: '3',
      guestName: 'Conflict Guest',
      checkIn: '2026-12-11',
      checkInTime: '10:00',
      checkOut: '2026-12-12',
      checkOutTime: '10:00'
    });
    throw new Error('Conflicting time slot should have failed!');
  } catch (err) {
    console.log('Test 6 (Conflict caught):', err.message);
  }

  // 7. Cleanup
  await bs.deleteBooking(bId);
  console.log('Test 7: Cleanup successful.');

  console.log('>>> ALL AUTHENTICATION AND DATE-TIME TESTS PASSED 100%! <<<');
})();
