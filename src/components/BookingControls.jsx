import { useEffect, useRef, useState } from 'react';
import { loginHost, roomConflictsWith } from '../data/bookingStore';

/**
 * Circular LED + status text for one room.
 * The text label carries the state too, so colour is never the only signal.
 * Red = Booked, green = Available (matching the wedding theme's LED styles).
 */
export function RoomStatusLight({ loaded, booked, unavailable = false }) {
  const state = unavailable || !loaded ? 'unknown' : booked ? 'booked' : 'free';
  const label = unavailable
    ? 'Unavailable'
    : !loaded
      ? 'Loading…'
      : booked
        ? 'Booked'
        : 'Available';

  return (
    <span className="acc-status">
      <span className={`acc-led is-${state}`} aria-hidden="true" />
      <span className="acc-status-text">{label}</span>
    </span>
  );
}

/** Shared open/close behaviour for the wedding-themed popups. */
function useModal(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const focusTimer = setTimeout(() => {
      const field = document.querySelector('.acc-modal [data-autofocus]');
      if (field) field.focus();
    }, 60);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('locked');

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('locked');
    };
  }, [open]);
}

/**
 * Discreet host login popup: four-digit numeric access code.
 * The code is verified by the server (Postgres), never compared here — this
 * component only checks that four digits were typed before sending.
 */
export function HostLoginDialog({ open, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  onCloseRef.current = onClose;
  onSuccessRef.current = onSuccess;

  useModal(open, onClose);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await loginHost(code);
      setCode('');
      onSuccessRef.current();
    } catch (err) {
      setError((err && err.message) || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="acc-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCloseRef.current();
      }}
    >
      <div
        className="acc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acc-login-title"
        aria-describedby="acc-login-desc"
      >
        <span className="acc-modal-ornament" aria-hidden="true">
          ❀
        </span>
        <h2 id="acc-login-title">Host Login</h2>
        <p id="acc-login-desc" className="acc-modal-copy">
          Enter your four-digit access code to manage room bookings.
        </p>

        <form className="acc-modal-form" onSubmit={handleSubmit}>
          <label className="acc-sr-only" htmlFor="acc-host-code">
            Four-digit access code
          </label>
          <input
            id="acc-host-code"
            data-autofocus
            className={`acc-pin-input${error ? ' has-error' : ''}`}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="••••"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 4));
              if (error) setError('');
            }}
            aria-invalid={String(Boolean(error))}
            aria-describedby={error ? 'acc-login-error' : 'acc-login-desc'}
          />

          <div className="acc-modal-actions">
            <button className="gold-button acc-pin-submit" type="submit" disabled={busy || code.length !== 4}>
              {busy ? 'Checking…' : 'Login'}
            </button>
            <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>

        {error && (
          <p id="acc-login-error" className="acc-error" role="alert">
            {error}
          </p>
        )}

        <p className="acc-modal-note">Verified securely on the server — guest details stay protected.</p>
      </div>
    </div>
  );
}

/**
 * Add / edit booking form: guest name, room number, check-in and check-out
 * dates. Client-side checks give instant feedback; the server validates every
 * value again (including overlapping bookings) before saving.
 */
export function BookingFormDialog({ open, mode, booking, property, bookings, onClose, onSubmit }) {
  const [guestName, setGuestName] = useState('');
  const [room, setRoom] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const onCloseRef = useRef(onClose);
  const onSubmitRef = useRef(onSubmit);
  onCloseRef.current = onClose;
  onSubmitRef.current = onSubmit;

  const isEdit = mode === 'edit';

  useModal(open, onClose);

  useEffect(() => {
    if (open) {
      setGuestName(booking ? booking.guest_name : '');
      setRoom(booking ? String(booking.room) : '');
      setCheckIn(booking ? booking.check_in : '');
      setCheckOut(booking ? booking.check_out : '');
      setErrors({});
      setFormError('');
      setBusy(false);
    } else {
      setGuestName('');
      setRoom('');
      setCheckIn('');
      setCheckOut('');
      setErrors({});
      setFormError('');
      setBusy(false);
    }
  }, [open, booking]);

  if (!open) return null;

  const ignoreId = booking ? booking.id : undefined;
  const conflictFor = (roomNumber) =>
    roomConflictsWith(property.id, roomNumber, checkIn, checkOut, bookings, ignoreId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    const values = {
      guestName: guestName.trim(),
      room,
      checkIn,
      checkOut,
    };

    const nextErrors = {};
    if (!values.guestName) nextErrors.guestName = 'Guest name is required.';
    else if (values.guestName.length > 120)
      nextErrors.guestName = 'Guest name is too long (120 characters maximum).';
    if (!values.room) nextErrors.room = 'Please choose a room.';
    if (!values.checkIn) nextErrors.checkIn = 'Check-in date is required.';
    if (!values.checkOut) nextErrors.checkOut = 'Check-out date is required.';
    if (values.checkIn && values.checkOut && values.checkOut <= values.checkIn)
      nextErrors.checkOut = 'Check-out must be later than check-in.';
    if (
      !nextErrors.room &&
      values.room &&
      values.checkIn &&
      values.checkOut &&
      !nextErrors.checkOut &&
      conflictFor(values.room)
    ) {
      nextErrors.room = 'This room is already booked for those dates.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('');
      return;
    }

    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      await onSubmitRef.current(values);
      onCloseRef.current();
    } catch (err) {
      setFormError((err && err.message) || 'Could not save the booking. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (name) =>
    errors[name] ? (
      <span className="acc-field-error" id={`bf-${name}-error`} role="alert">
        {errors[name]}
      </span>
    ) : null;

  return (
    <div
      className="acc-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCloseRef.current();
      }}
    >
      <div
        className="acc-modal is-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acc-form-title"
      >
        <span className="acc-modal-ornament" aria-hidden="true">
          ❀
        </span>
        <h2 id="acc-form-title">{isEdit ? 'Edit Booking' : 'Add Booking'}</h2>
        <p className="acc-modal-copy">
          {isEdit
            ? 'Update the guest details, room or dates for this reservation.'
            : `Assign a guest to an available room at ${property.name}.`}
        </p>

        <form className="acc-booking-form" onSubmit={handleSubmit} noValidate>
          <div className="acc-form-grid">
            <div className="acc-field">
              <label htmlFor="bf-guest">Guest Name</label>
              <input
                id="bf-guest"
                data-autofocus
                type="text"
                autoComplete="off"
                maxLength={120}
                placeholder="e.g. Ramesh & family"
                value={guestName}
                onChange={(event) => {
                  setGuestName(event.target.value);
                  if (errors.guestName) setErrors((prev) => ({ ...prev, guestName: '' }));
                }}
                aria-invalid={String(Boolean(errors.guestName))}
                aria-describedby={errors.guestName ? 'bf-guestName-error' : undefined}
              />
              {fieldError('guestName')}
            </div>

            <div className="acc-field">
              <label htmlFor="bf-room">Room Number</label>
              <select
                id="bf-room"
                value={room}
                onChange={(event) => {
                  setRoom(event.target.value);
                  if (errors.room) setErrors((prev) => ({ ...prev, room: '' }));
                }}
                aria-invalid={String(Boolean(errors.room))}
                aria-describedby={errors.room ? 'bf-room-error' : undefined}
              >
                <option value="">Select a room</option>
                {property.rooms.map((roomNumber) => {
                  const blocked = Boolean(checkIn && checkOut && conflictFor(roomNumber));
                  return (
                    <option key={roomNumber} value={roomNumber} disabled={blocked}>
                      Room {roomNumber}
                      {blocked ? ' — unavailable for these dates' : ''}
                    </option>
                  );
                })}
              </select>
              {fieldError('room')}
            </div>

            <div className="acc-field">
              <label htmlFor="bf-check-in">Check-in Date</label>
              <input
                id="bf-check-in"
                type="date"
                value={checkIn}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  if (errors.checkIn) setErrors((prev) => ({ ...prev, checkIn: '' }));
                }}
                aria-invalid={String(Boolean(errors.checkIn))}
                aria-describedby={errors.checkIn ? 'bf-checkIn-error' : undefined}
              />
              {fieldError('checkIn')}
            </div>

            <div className="acc-field">
              <label htmlFor="bf-check-out">Check-out Date</label>
              <input
                id="bf-check-out"
                type="date"
                value={checkOut}
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  if (errors.checkOut) setErrors((prev) => ({ ...prev, checkOut: '' }));
                }}
                aria-invalid={String(Boolean(errors.checkOut))}
                aria-describedby={errors.checkOut ? 'bf-checkOut-error' : undefined}
              />
              {fieldError('checkOut')}
            </div>
          </div>

          {formError && (
            <p className="acc-error" role="alert">
              {formError}
            </p>
          )}

          <div className="acc-modal-actions">
            <button className="gold-button" type="submit" disabled={busy}>
              {busy ? (isEdit ? 'Saving…' : 'Booking…') : isEdit ? 'Save Changes' : 'Book Room'}
            </button>
            <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>

        <p className="acc-modal-note">Validated and saved securely on the server.</p>
      </div>
    </div>
  );
}

/**
 * Small confirmation popup (used before cancelling a booking).
 * `onConfirm` may return a promise; errors are surfaced inside the popup.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;

  useModal(open, onClose);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onConfirmRef.current();
      onCloseRef.current();
    } catch (err) {
      setError((err && err.message) || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="acc-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCloseRef.current();
      }}
    >
      <div className="acc-modal is-confirm" role="dialog" aria-modal="true" aria-labelledby="acc-confirm-title">
        <span className="acc-modal-ornament" aria-hidden="true">
          ❀
        </span>
        <h2 id="acc-confirm-title">{title}</h2>
        <p className="acc-modal-copy">{message}</p>

        {error && (
          <p className="acc-error" role="alert">
            {error}
          </p>
        )}

        <div className="acc-modal-actions">
          <button
            data-autofocus
            className="gold-button acc-confirm-button"
            type="button"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
          <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
