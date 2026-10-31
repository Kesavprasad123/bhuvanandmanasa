import { useEffect, useRef, useState } from 'react';
import { CHECK_IN_TIME, CHECK_OUT_TIME } from '../data/accommodation';
import {
  loginHost,
  roomConflictsWith,
  setHostPin,
} from '../data/bookingStore';

/**
 * Status indicator + label for a room.
 * Red / Amber = Occupied, Green = Available.
 */
export function RoomStatusLight({ loaded, booked, unavailable = false, compact = false }) {
  const state = unavailable || !loaded ? 'unknown' : booked ? 'booked' : 'free';
  const label = unavailable
    ? 'Unavailable'
    : !loaded
      ? 'Loading…'
      : booked
        ? 'Occupied'
        : 'Available';

  return (
    <span className={`acc-status${compact ? ' is-compact' : ''}`}>
      <span className={`acc-led is-${state}`} aria-hidden="true" />
      <span className="acc-status-text">{label}</span>
    </span>
  );
}

/** Shared modal open/close accessibility handler. */
export function useModal(open, onClose) {
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
 * Host Login Dialog: 4-digit PIN authentication.
 */
export function HostLoginDialog({ open, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  onCloseRef.current = onClose;
  onSuccessRef.current = onSuccess;

  useModal(open, onClose);

  useEffect(() => {
    if (!open) {
      setPin('');
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
      await loginHost(pin);
      setPin('');
      onSuccessRef.current();
    } catch (err) {
      setError((err && err.message) || 'Invalid 4-digit PIN. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleKeypadDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (error) setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    if (error) setError('');
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
        className="acc-modal acc-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acc-login-title"
        aria-describedby="acc-login-desc"
      >
        <span className="acc-modal-ornament" aria-hidden="true">
          👑
        </span>
        <h2 id="acc-login-title">Host Login</h2>
        <p id="acc-login-desc" className="acc-modal-copy">
          Enter your 4-digit secret PIN to access the dynamic room allocation tracker.
        </p>

        <form className="acc-modal-form" onSubmit={handleSubmit}>
          <div className="acc-pin-display" aria-live="polite">
            {[0, 1, 2, 3].map((index) => {
              const filled = index < pin.length;
              return (
                <span
                  key={index}
                  className={`acc-pin-dot${filled ? ' is-filled' : ''}${error ? ' is-error' : ''}`}
                />
              );
            })}
          </div>

          <label className="acc-sr-only" htmlFor="acc-host-pin">
            4-digit PIN code
          </label>
          <input
            id="acc-host-pin"
            data-autofocus
            className="acc-sr-only"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              if (error) setError('');
            }}
          />

          {/* Quick tactile keypad for seamless mobile touch */}
          <div className="acc-keypad" role="group" aria-label="PIN keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => {
              if (k === 'C') {
                return (
                  <button
                    key={k}
                    type="button"
                    className="acc-keypad-btn is-action"
                    onClick={() => setPin('')}
                  >
                    Clear
                  </button>
                );
              }
              if (k === '⌫') {
                return (
                  <button
                    key={k}
                    type="button"
                    className="acc-keypad-btn is-action"
                    onClick={handleBackspace}
                    aria-label="Delete last digit"
                  >
                    ⌫
                  </button>
                );
              }
              return (
                <button
                  key={k}
                  type="button"
                  className="acc-keypad-btn"
                  onClick={() => handleKeypadDigit(k)}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {error && (
            <p id="acc-login-error" className="acc-error" role="alert">
              {error}
            </p>
          )}

          <div className="acc-modal-actions">
            <button
              className="gold-button acc-pin-submit"
              type="submit"
              disabled={busy || pin.length !== 4}
            >
              {busy ? 'Verifying…' : 'Unlock Dashboard'}
            </button>
            <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>

        <p className="acc-modal-note">
          Confidential access for the wedding host only. Guest details are strictly protected.
        </p>
      </div>
    </div>
  );
}

/**
 * Change Host PIN Dialog: lets host update their 4-digit code.
 */
export function ChangePinDialog({ open, onClose, onSuccess }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useModal(open, onClose);

  useEffect(() => {
    if (!open) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match.');
      return;
    }
    setBusy(true);
    try {
      setHostPin(currentPin, newPin);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError((err && err.message) || 'Failed to update PIN.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="acc-modal-backdrop" role="presentation">
      <div className="acc-modal" role="dialog" aria-modal="true" aria-labelledby="acc-pin-change-title">
        <h2 id="acc-pin-change-title">Change Host PIN</h2>
        <p className="acc-modal-copy">Update your confidential 4-digit access code.</p>

        <form onSubmit={handleSubmit} className="acc-modal-form">
          <div className="acc-field">
            <label htmlFor="cp-curr">Current 4-digit PIN</label>
            <input
              id="cp-curr"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          <div className="acc-field">
            <label htmlFor="cp-new">New 4-digit PIN</label>
            <input
              id="cp-new"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="New 4 digits"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          <div className="acc-field">
            <label htmlFor="cp-conf">Confirm New PIN</label>
            <input
              id="cp-conf"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Repeat 4 digits"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          {error && <p className="acc-error" role="alert">{error}</p>}

          <div className="acc-modal-actions">
            <button className="gold-button" type="submit" disabled={busy || newPin.length !== 4}>
              {busy ? 'Updating…' : 'Save New PIN'}
            </button>
            <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Dynamic Room Allocation Dialog:
 * Quickly allocate a guest name, toggle occupied/available status,
 * and select dates for a specific room.
 */
export function RoomAllocationDialog({
  open,
  property,
  room,
  currentAllocation,
  onClose,
  onSave,
  onClear,
}) {
  const [guestName, setGuestName] = useState('');
  const [isOccupied, setIsOccupied] = useState(true);
  const [checkIn, setCheckIn] = useState('2026-12-12');
  const [checkOut, setCheckOut] = useState('2026-12-13');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useModal(open, onClose);

  useEffect(() => {
    if (open) {
      if (currentAllocation) {
        setGuestName(currentAllocation.guest_name || '');
        setIsOccupied(currentAllocation.status === 'active');
        setCheckIn(currentAllocation.check_in || '2026-12-12');
        setCheckOut(currentAllocation.check_out || '2026-12-13');
      } else {
        setGuestName('');
        setIsOccupied(true);
        setCheckIn('2026-12-12');
        setCheckOut('2026-12-13');
      }
      setError('');
      setBusy(false);
    }
  }, [open, currentAllocation]);

  if (!open) return null;

  const datePresets = [
    { label: 'Dec 12 - 13 (Wedding Day)', in: '2026-12-12', out: '2026-12-13' },
    { label: 'Dec 11 - 13 (2 Nights)', in: '2026-12-11', out: '2026-12-13' },
    { label: 'Dec 10 - 13 (Full Stay - 3 Nights)', in: '2026-12-10', out: '2026-12-13' },
    { label: 'Dec 12 - 14 (Extended)', in: '2026-12-12', out: '2026-12-14' },
  ];

  const handlePresetClick = (preset) => {
    setCheckIn(preset.in);
    setCheckOut(preset.out);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (isOccupied && !guestName.trim()) {
      setError('Please enter guest name(s) or mark room as Available.');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be later than check-in date.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSave({
        propertyId: property.id,
        room: String(room),
        guestName: guestName.trim(),
        status: isOccupied ? 'active' : 'cancelled',
        checkIn,
        checkOut,
      });
      onClose();
    } catch (err) {
      setError((err && err.message) || 'Failed to update room allocation.');
    } finally {
      setBusy(false);
    }
  };

  const handleClearRoom = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (onClear) {
        await onClear(property.id, String(room));
      }
      onClose();
    } catch (err) {
      setError((err && err.message) || 'Failed to clear room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="acc-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="acc-modal is-wide acc-allocation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acc-alloc-title"
      >
        <div className="acc-modal-header-badge">
          <span className="acc-room-badge is-large">Room {room}</span>
          <span className="acc-property-badge">{property ? property.name : ''}</span>
        </div>

        <h2 id="acc-alloc-title">Manage Room Allocation</h2>
        <p className="acc-modal-copy">
          Assign guest names, occupancy status, and stay dates dynamically.
        </p>

        <form onSubmit={handleSubmit} className="acc-booking-form">
          {/* Status Toggle Switch */}
          <div className="acc-status-toggle-group">
            <span className="acc-field-label">Occupancy Status</span>
            <div className="acc-toggle-switch">
              <button
                type="button"
                className={`acc-toggle-btn${isOccupied ? ' is-active-occupied' : ''}`}
                onClick={() => setIsOccupied(true)}
              >
                🔴 Occupied
              </button>
              <button
                type="button"
                className={`acc-toggle-btn${!isOccupied ? ' is-active-available' : ''}`}
                onClick={() => setIsOccupied(false)}
              >
                🟢 Available / Vacant
              </button>
            </div>
          </div>

          {/* Guest Name Field */}
          <div className="acc-field">
            <label htmlFor="alloc-guest">Guest Name(s) / Family</label>
            <input
              id="alloc-guest"
              data-autofocus
              type="text"
              autoComplete="off"
              placeholder="e.g. Sridhar, Radha Krisha, Btech Friends..."
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          {/* Date Presets */}
          <div className="acc-presets-section">
            <span className="acc-field-label">Quick Stay Dates</span>
            <div className="acc-date-presets">
              {datePresets.map((preset) => {
                const active = checkIn === preset.in && checkOut === preset.out;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`acc-preset-chip${active ? ' is-selected' : ''}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates Custom Picker */}
          <div className="acc-form-grid">
            <div className="acc-field">
              <label htmlFor="alloc-checkin">Check-in Date</label>
              <input
                id="alloc-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="acc-field">
              <label htmlFor="alloc-checkout">Check-out Date</label>
              <input
                id="alloc-checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          {/* Static Timings Box */}
          <div className="acc-static-timings-box">
            <span className="acc-timings-badge">
              🕒 Check-in Time: <strong>{CHECK_IN_TIME}</strong> (Fixed)
            </span>
            <span className="acc-timings-badge">
              🕚 Check-out Time: <strong>{CHECK_OUT_TIME}</strong> (Fixed)
            </span>
          </div>

          {error && (
            <p className="acc-error" role="alert">
              {error}
            </p>
          )}

          <div className="acc-modal-actions">
            <button className="gold-button" type="submit" disabled={busy}>
              {busy ? 'Saving Allocation…' : 'Save Allocation'}
            </button>
            <button
              className="acc-danger-button"
              type="button"
              onClick={handleClearRoom}
              disabled={busy}
              title="Clears guest name and marks room available"
            >
              Clear / Free Room
            </button>
            <button className="acc-ghost-button" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Confirmation dialog for destructive actions.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      await onConfirm();
      onClose();
    } catch (err) {
      setError((err && err.message) || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="acc-modal-backdrop" role="presentation">
      <div className="acc-modal is-confirm" role="dialog" aria-modal="true" aria-labelledby="acc-confirm-title">
        <h2 id="acc-confirm-title">{title}</h2>
        <p className="acc-modal-copy">{message}</p>
        {error && <p className="acc-error" role="alert">{error}</p>}
        <div className="acc-modal-actions">
          <button className="gold-button acc-confirm-button" type="button" onClick={handleConfirm} disabled={busy}>
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

/**
 * Backward compatibility wrapper for BookingFormDialog.
 */
export function BookingFormDialog({ open, mode, booking, property, bookings, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const currentAllocation = booking || null;

  return (
    <RoomAllocationDialog
      open={open}
      property={property}
      room={booking ? booking.room : (property && property.rooms[0]) || '1'}
      currentAllocation={currentAllocation}
      onClose={onClose}
      onSave={async (values) => {
        await onSubmit(values);
      }}
      onClear={null}
    />
  );
}
