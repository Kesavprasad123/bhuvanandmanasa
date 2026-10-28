import { useCallback, useEffect, useMemo, useState } from 'react';
import { PROPERTIES } from '../data/accommodation';
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  isSessionExpired,
  setBookingStatus,
  subscribeToDatabaseChanges,
  unblockRoom,
  updateBooking,
} from '../data/bookingStore';
import { BookingFormDialog, ConfirmDialog, RoomStatusLight } from './BookingControls';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) return String(iso);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * Host-only dashboard: pick a property, see its stats and room lights, then
 * search / filter / add / edit / cancel bookings. Guest details are rendered
 * only here, and every mutation goes through a server-verified host session.
 */
function HostDashboard({
  availability,
  availabilityState,
  onAvailabilityRefresh,
  onExit,
  onLogout,
  onSessionExpired,
}) {
  const [propertyId, setPropertyId] = useState(PROPERTIES[0].id);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialog, setDialog] = useState(null); // 'add' | { type:'edit', booking } | { type:'confirm', booking } | { type:'delete', booking }
  const [busyId, setBusyId] = useState(null);
  const [busyRoom, setBusyRoom] = useState(null);

  const property = PROPERTIES.find((item) => item.id === propertyId) || PROPERTIES[0];

  const loadBookings = useCallback(async () => {
    try {
      const rows = await fetchBookings();
      setBookings(rows);
      setLoadError('');
    } catch (error) {
      if (isSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setLoadError((error && error.message) || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadBookings(), onAvailabilityRefresh()]);
  }, [loadBookings, onAvailabilityRefresh]);

  // Load bookings on open, then keep them in sync with other devices and tabs.
  useEffect(() => {
    loadBookings();
    const unsub = subscribeToDatabaseChanges(() => {
      refreshAll();
    });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadBookings();
    }, 15000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [loadBookings, refreshAll]);

  const counts = useMemo(() => {
    const total = property.rooms.length;
    const map = availability ? availability[propertyId] : null;
    if (!map) return { total, booked: null, available: null };
    const booked = property.rooms.filter((room) => map[room]).length;
    return { total, booked, available: total - booked };
  }, [availability, property, propertyId]);

  const propertyBookings = useMemo(
    () => bookings.filter((booking) => booking.property_id === propertyId),
    [bookings, propertyId]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return propertyBookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        String(booking.guest_name || '')
          .toLowerCase()
          .includes(needle) || String(booking.room).toLowerCase().includes(needle)
      );
    });
  }, [propertyBookings, query, statusFilter]);

  const handlePropertyChange = (id) => {
    setPropertyId(id);
    setQuery('');
    setActionError('');
  };

  const submitBooking = async (values) => {
    try {
      if (dialog && dialog.type === 'edit') {
        await updateBooking({
          id: dialog.booking.id,
          room: values.room,
          guestName: values.guestName,
          checkIn: values.checkIn,
          checkOut: values.checkOut,
        });
      } else {
        await createBooking({
          propertyId,
          room: values.room,
          guestName: values.guestName,
          checkIn: values.checkIn,
          checkOut: values.checkOut,
        });
      }
    } catch (error) {
      if (isSessionExpired(error)) onSessionExpired();
      throw error;
    }
    await refreshAll();
  };

  const confirmCancel = async () => {
    try {
      await setBookingStatus(dialog.booking.id, 'cancelled');
    } catch (error) {
      if (isSessionExpired(error)) onSessionExpired();
      throw error;
    }
    await refreshAll();
  };

  const confirmDelete = async () => {
    try {
      await deleteBooking(dialog.booking.id);
    } catch (error) {
      if (isSessionExpired(error)) onSessionExpired();
      throw error;
    }
    await refreshAll();
  };

  // Frees a booked room by cancelling its active booking(s); the room turns
  // Available (green) and can be re-booked. Cancelled rows stay for Restore.
  const handleUnblock = async (room) => {
    setBusyRoom(room);
    setActionError('');
    try {
      await unblockRoom(propertyId, room);
      await refreshAll();
    } catch (error) {
      if (isSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setActionError((error && error.message) || 'Could not unblock the room.');
    } finally {
      setBusyRoom(null);
    }
  };

  const handleUnblockBooking = async (booking) => {
    setBusyId(booking.id);
    setActionError('');
    try {
      await setBookingStatus(booking.id, 'cancelled');
      await refreshAll();
    } catch (error) {
      if (isSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setActionError((error && error.message) || 'Could not unblock the booking.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (booking) => {
    setBusyId(booking.id);
    setActionError('');
    try {
      await setBookingStatus(booking.id, 'active');
      await refreshAll();
    } catch (error) {
      if (isSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setActionError((error && error.message) || 'Could not restore the booking.');
    } finally {
      setBusyId(null);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  const statusLabelFor = (status) => (status === 'active' ? 'Booked' : 'Cancelled');

  return (
    <section className="acc-dash" aria-labelledby="acc-dash-title">
      <div className="acc-dash-head reveal">
        <div className="acc-dash-title-block">
          <p className="acc-eyebrow">Host only</p>
          <h2 id="acc-dash-title">Room Booking Dashboard</h2>
          <p className="acc-dash-sub">
            Guest details stay private — they are visible only while you are logged in.
          </p>
        </div>
        <div className="acc-dash-head-actions">
          <button type="button" className="acc-ghost-button" onClick={onExit}>
            ← View stays
          </button>
          <button type="button" className="acc-ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="acc-dash-controls reveal">
        <div className="acc-tabs" role="group" aria-label="Choose a property">
          {PROPERTIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`acc-tab${item.id === propertyId ? ' active' : ''}`}
              aria-pressed={String(item.id === propertyId)}
              onClick={() => handlePropertyChange(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <ul className="acc-chips acc-dash-chips">
          <li className="acc-chip">
            <span className="acc-chip-label">Total Rooms</span>
            <strong>{counts.total}</strong>
          </li>
          <li className="acc-chip is-booked">
            <span className="acc-chip-label">Booked</span>
            <strong>{counts.booked === null ? '—' : counts.booked}</strong>
          </li>
          <li className="acc-chip is-free">
            <span className="acc-chip-label">Available</span>
            <strong>{counts.available === null ? '—' : counts.available}</strong>
          </li>
        </ul>
      </div>

      <div className="acc-panel acc-rooms-panel reveal">
        <p className="acc-result-count">Room status · {property.name}</p>
        <div className="acc-room-strip">
          {property.rooms.map((room) => {
            const isBooked = Boolean(availability && availability[propertyId] && availability[propertyId][room]);
            return (
              <div className="acc-room-tile" key={room}>
                <span className="acc-room-badge">{room}</span>
                <RoomStatusLight
                  loaded={availabilityState === 'ready'}
                  unavailable={availabilityState === 'error'}
                  booked={isBooked}
                />
                {isBooked && (
                  <button
                    type="button"
                    className="acc-action-btn is-unblock acc-room-action"
                    disabled={busyRoom === room}
                    onClick={() => handleUnblock(room)}
                    title={`Free room ${room} — cancel its active booking so it becomes Available`}
                  >
                    {busyRoom === room ? 'Unblocking…' : 'Unblocked'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="acc-toolbar reveal">
        <label className="acc-search" htmlFor="dash-search">
          <span className="acc-sr-only">Search guest name or room number</span>
          <span className="acc-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="dash-search"
            type="search"
            autoComplete="off"
            placeholder="Search by guest name or room number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="acc-select" htmlFor="dash-status">
          <span className="acc-select-label">Status</span>
          <select id="dash-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="acc-admin-button"
          onClick={() => {
            setActionError('');
            setDialog({ type: 'add' });
          }}
        >
          <span aria-hidden="true">＋</span> Add Booking
        </button>
      </div>

      {loadError && (
        <p className="acc-status-error" role="alert">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="acc-status-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="acc-panel reveal">
        {loading ? (
          <div className="acc-empty">
            <p>Loading bookings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="acc-empty">
            {propertyBookings.length === 0 ? (
              <>
                <p>No bookings yet at {property.name}.</p>
                <button
                  type="button"
                  className="acc-admin-button"
                  onClick={() => {
                    setActionError('');
                    setDialog({ type: 'add' });
                  }}
                >
                  <span aria-hidden="true">＋</span> Add Booking
                </button>
              </>
            ) : (
              <>
                <p>
                  {query
                    ? `No bookings match “${query}”.`
                    : `No ${statusFilter === 'active' ? 'booked' : 'cancelled'} bookings at ${property.name}.`}
                </p>
                <button type="button" className="acc-ghost-button" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="acc-result-count">
              Showing {filtered.length} of {propertyBookings.length} bookings · {property.name}
            </p>
            <div className="acc-table-wrap">
              <table className="acc-table">
                <caption className="acc-sr-only">Bookings at {property.name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Room</th>
                    <th scope="col">Guest</th>
                    <th scope="col">Check-in</th>
                    <th scope="col">Check-out</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking) => (
                    <tr key={booking.id}>
                      <td data-label="Room" className="acc-room-cell">
                        <span className="acc-room-badge">{booking.room}</span>
                      </td>
                      <td data-label="Guest" className="acc-guest-cell">
                        {booking.guest_name}
                      </td>
                      <td data-label="Check-in">{formatDate(booking.check_in)}</td>
                      <td data-label="Check-out">{formatDate(booking.check_out)}</td>
                      <td data-label="Status">
                        <span className={`acc-pill is-${booking.status}`}>
                          {statusLabelFor(booking.status)}
                        </span>
                      </td>
                      <td data-label="Actions" className="acc-actions-cell">
                        <div className="acc-actions">
                          <button
                            type="button"
                            className="acc-action-btn is-edit"
                            disabled={busyId === booking.id}
                            onClick={() => {
                              setActionError('');
                              setDialog({ type: 'edit', booking });
                            }}
                          >
                            Edit
                          </button>
                          {booking.status === 'active' ? (
                            <button
                              type="button"
                              className="acc-action-btn is-unblock"
                              disabled={busyId === booking.id}
                              onClick={() => handleUnblockBooking(booking)}
                              title={`Unblock room ${booking.room} — marks it Available`}
                            >
                              {busyId === booking.id ? 'Unblocking…' : 'Unblocked'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="acc-action-btn is-success"
                              disabled={busyId === booking.id}
                              onClick={() => handleRestore(booking)}
                              title="Restore this booking"
                            >
                              {busyId === booking.id ? 'Restoring…' : 'Restore'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="acc-action-btn is-delete"
                            disabled={busyId === booking.id}
                            onClick={() => {
                              setActionError('');
                              setDialog({ type: 'delete', booking });
                            }}
                            title="Delete this booking permanently"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <BookingFormDialog
        open={Boolean(dialog && (dialog.type === 'add' || dialog.type === 'edit'))}
        mode={dialog && dialog.type === 'edit' ? 'edit' : 'add'}
        booking={dialog && dialog.type === 'edit' ? dialog.booking : null}
        property={property}
        bookings={propertyBookings}
        onClose={() => setDialog(null)}
        onSubmit={submitBooking}
      />

      <ConfirmDialog
        open={Boolean(dialog && dialog.type === 'delete')}
        title="Delete Booking"
        message="Are you sure you want to delete this booking?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDialog(null)}
      />
    </section>
  );
}

export default HostDashboard;
