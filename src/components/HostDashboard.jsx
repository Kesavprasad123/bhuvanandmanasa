import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHECK_IN_TIME, CHECK_OUT_TIME, PROPERTIES } from '../data/accommodation';
import {
  clearRoomAllocation,
  fetchBookings,
  generateWhatsAppSummary,
  isSessionExpired,
  saveRoomAllocation,
  subscribeToDatabaseChanges,
  toggleRoomStatus,
} from '../data/bookingStore';
import {
  ChangePinDialog,
  ConfirmDialog,
  RoomAllocationDialog,
} from './BookingControls';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateShort(iso) {
  if (!iso) return '—';
  const parts = String(iso).split('-');
  if (parts.length < 3) return iso;
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return `${day} ${MONTHS[monthIdx] || ''}`;
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = d2 - d1;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Host Dashboard: dynamic tracking of room allocations across
 * Krishna Inn and SVPC (Wedding Convention).
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
  const [toastMessage, setToastMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'occupied' | 'available'

  // Dialog states
  const [activeAllocationDialog, setActiveAllocationDialog] = useState(null); // { property, room, currentAllocation }
  const [showChangePin, setShowChangePin] = useState(false);
  const [confirmClearDialog, setConfirmClearDialog] = useState(null); // { propertyId, room }
  const [busyRoom, setBusyRoom] = useState(null);

  const property = PROPERTIES.find((item) => item.id === propertyId) || PROPERTIES[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const loadAllBookings = useCallback(async () => {
    try {
      const rows = await fetchBookings();
      setBookings(rows);
      setLoadError('');
    } catch (error) {
      if (isSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setLoadError((error && error.message) || 'Could not load allocations.');
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadAllBookings(), onAvailabilityRefresh()]);
  }, [loadAllBookings, onAvailabilityRefresh]);

  useEffect(() => {
    loadAllBookings();
    const unsub = subscribeToDatabaseChanges(() => {
      refreshAll();
    });
    return () => {
      unsub();
    };
  }, [loadAllBookings, refreshAll]);

  // Map allocations for current property (1 to 8)
  const roomAllocations = useMemo(() => {
    const propBookings = bookings.filter((b) => b.property_id === propertyId);
    return property.rooms.map((roomNumber) => {
      const existing = propBookings.find(
        (b) => String(b.room) === String(roomNumber)
      );
      if (existing) return existing;
      return {
        id: `virtual_${propertyId}_${roomNumber}`,
        property_id: propertyId,
        room: String(roomNumber),
        guest_name: '',
        status: 'cancelled',
        check_in: '2026-12-12',
        check_out: '2026-12-13',
        check_in_time: CHECK_IN_TIME,
        check_out_time: CHECK_OUT_TIME,
      };
    });
  }, [bookings, property.rooms, propertyId]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const krishnaTotal = 8;
    const svpcTotal = 8;

    const krishnaOccupied = bookings.filter(
      (b) => b.property_id === 'krishna-inn' && b.status === 'active'
    ).length;

    const svpcOccupied = bookings.filter(
      (b) => b.property_id === 'svpc' && b.status === 'active'
    ).length;

    const totalOccupied = krishnaOccupied + svpcOccupied;
    const totalRooms = krishnaTotal + svpcTotal;

    return {
      krishna: { occupied: krishnaOccupied, total: krishnaTotal, available: krishnaTotal - krishnaOccupied },
      svpc: { occupied: svpcOccupied, total: svpcTotal, available: svpcTotal - svpcOccupied },
      totalOccupied,
      totalRooms,
      totalAvailable: totalRooms - totalOccupied,
    };
  }, [bookings]);

  // Filtered room cards
  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roomAllocations.filter((item) => {
      const isOccupied = item.status === 'active';
      if (statusFilter === 'occupied' && !isOccupied) return false;
      if (statusFilter === 'available' && isOccupied) return false;

      if (!needle) return true;
      const matchesName = String(item.guest_name || '').toLowerCase().includes(needle);
      const matchesRoom = String(item.room).toLowerCase().includes(needle);
      return matchesName || matchesRoom;
    });
  }, [roomAllocations, query, statusFilter]);

  // Handler: Save allocation
  const handleSaveAllocation = async (values) => {
    try {
      await saveRoomAllocation(values);
      await refreshAll();
      showToast(`Room ${values.room} allocated successfully!`);
    } catch (err) {
      if (isSessionExpired(err)) onSessionExpired();
      throw err;
    }
  };

  // Handler: Free / Clear room
  const handleClearRoom = async (propId, room) => {
    try {
      await clearRoomAllocation(propId, room);
      await refreshAll();
      showToast(`Room ${room} is now free and marked Available.`);
    } catch (err) {
      if (isSessionExpired(err)) onSessionExpired();
      throw err;
    }
  };

  // Handler: Toggle status
  const handleToggleRoomStatus = async (room) => {
    setBusyRoom(room);
    try {
      await toggleRoomStatus(propertyId, room);
      await refreshAll();
      showToast(`Room ${room} status updated!`);
    } catch (err) {
      if (isSessionExpired(err)) onSessionExpired();
      showToast((err && err.message) || 'Failed to update status.');
    } finally {
      setBusyRoom(null);
    }
  };

  // Handler: Copy WhatsApp Summary
  const handleCopyWhatsAppSummary = async () => {
    const summary = generateWhatsAppSummary();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('📋 WhatsApp allocation summary copied to clipboard!');
    } catch {
      showToast('Could not auto-copy. Summary prepared.');
    }
  };

  return (
    <section className="acc-dash" aria-labelledby="acc-dash-title">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="acc-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {/* Host Control Header */}
      <div className="acc-dash-head reveal">
        <div className="acc-dash-title-block">
          <div className="acc-host-badge-row">
            <span className="acc-host-badge">👑 HOST DASHBOARD</span>
            <span className="acc-live-pulse-badge">● Live Sync</span>
          </div>
          <h2 id="acc-dash-title">Room Allocation Tracker</h2>
          <p className="acc-dash-sub">
            Dynamically assign rooms, update guest names &amp; stay dates for the wedding day.
          </p>
        </div>

        <div className="acc-dash-head-actions">
          <button
            type="button"
            className="acc-whatsapp-button"
            onClick={handleCopyWhatsAppSummary}
            title="Copy WhatsApp-formatted summary to paste into family or driver groups"
          >
            📋 Copy WhatsApp Summary
          </button>
          <button
            type="button"
            className="acc-ghost-button"
            onClick={() => setShowChangePin(true)}
            title="Change your secret 4-digit PIN code"
          >
            🔑 PIN Code
          </button>
          <button type="button" className="acc-ghost-button" onClick={onExit}>
            ← Guest View
          </button>
          <button type="button" className="acc-ghost-button is-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Master Overview Metric Card */}
      <div className="acc-metrics-strip reveal">
        <div className="acc-metric-card is-primary">
          <span className="acc-metric-label">Total Occupancy</span>
          <span className="acc-metric-val">
            {overallStats.totalOccupied} / {overallStats.totalRooms}
          </span>
          <span className="acc-metric-note">
            {overallStats.totalAvailable} rooms available across all locations
          </span>
        </div>

        <div
          className={`acc-metric-card${propertyId === 'krishna-inn' ? ' is-active-location' : ''}`}
          onClick={() => setPropertyId('krishna-inn')}
          role="button"
          tabIndex={0}
        >
          <span className="acc-metric-label">Krishna Inn</span>
          <span className="acc-metric-val">
            {overallStats.krishna.occupied} / 8 <small>Occupied</small>
          </span>
          <span className="acc-metric-note">
            {overallStats.krishna.available} available · Family &amp; Guests
          </span>
        </div>

        <div
          className={`acc-metric-card${propertyId === 'svpc' ? ' is-active-location' : ''}`}
          onClick={() => setPropertyId('svpc')}
          role="button"
          tabIndex={0}
        >
          <span className="acc-metric-label">SVPC Convention</span>
          <span className="acc-metric-val">
            {overallStats.svpc.occupied} / 8 <small>Occupied</small>
          </span>
          <span className="acc-metric-note">
            {overallStats.svpc.available} available · Convention Hall Stay
          </span>
        </div>
      </div>

      {/* Location Switcher Tabs */}
      <div className="acc-dash-controls reveal">
        <div className="acc-tabs" role="group" aria-label="Select stay location">
          {PROPERTIES.map((item) => {
            const isKrishna = item.id === 'krishna-inn';
            const occ = isKrishna ? overallStats.krishna.occupied : overallStats.svpc.occupied;
            return (
              <button
                key={item.id}
                type="button"
                className={`acc-tab${item.id === propertyId ? ' active' : ''}`}
                aria-pressed={String(item.id === propertyId)}
                onClick={() => {
                  setPropertyId(item.id);
                  setQuery('');
                }}
              >
                <span>{item.name}</span>
                <span className="acc-tab-badge">{occ}/8</span>
              </button>
            );
          })}
        </div>

        {/* Static Timings Pill Banner */}
        <div className="acc-timings-strip">
          <span className="acc-timing-item">🕒 Check-in: <strong>{CHECK_IN_TIME}</strong></span>
          <span className="acc-timing-separator">|</span>
          <span className="acc-timing-item">🕚 Check-out: <strong>{CHECK_OUT_TIME}</strong></span>
        </div>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div className="acc-toolbar reveal">
        <label className="acc-search" htmlFor="dash-search">
          <span className="acc-sr-only">Search by guest name or room number</span>
          <span className="acc-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="dash-search"
            type="search"
            autoComplete="off"
            placeholder="Search guest name or room (e.g. Sridhar, Room 4)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="acc-filter-pills" role="group" aria-label="Filter by status">
          <button
            type="button"
            className={`acc-filter-pill${statusFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All (8)
          </button>
          <button
            type="button"
            className={`acc-filter-pill is-occupied${statusFilter === 'occupied' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('occupied')}
          >
            Occupied ({propertyId === 'krishna-inn' ? overallStats.krishna.occupied : overallStats.svpc.occupied})
          </button>
          <button
            type="button"
            className={`acc-filter-pill is-available${statusFilter === 'available' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('available')}
          >
            Available ({propertyId === 'krishna-inn' ? overallStats.krishna.available : overallStats.svpc.available})
          </button>
        </div>
      </div>

      {loadError && (
        <p className="acc-status-error" role="alert">
          {loadError}
        </p>
      )}

      {/* Dynamic Interactive Room Grid */}
      <div className="acc-room-grid reveal">
        {loading ? (
          <div className="acc-empty">
            <p>Loading allocations…</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="acc-empty">
            <p>No rooms match your filter &ldquo;{query}&rdquo;.</p>
            <button
              type="button"
              className="acc-ghost-button"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredRooms.map((alloc) => {
            const isOccupied = alloc.status === 'active';
            const nights = calculateNights(alloc.check_in, alloc.check_out);
            const isBusy = busyRoom === alloc.room;

            return (
              <div
                key={alloc.room}
                className={`acc-room-card${isOccupied ? ' is-occupied' : ' is-available'}`}
              >
                {/* Room Card Top Row */}
                <div className="acc-rc-head">
                  <div className="acc-rc-number-wrap">
                    <span className="acc-rc-number">{alloc.room}</span>
                    <span className="acc-rc-tag">Room</span>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    className={`acc-rc-status-pill${isOccupied ? ' is-occupied' : ' is-available'}`}
                    disabled={isBusy}
                    onClick={() => handleToggleRoomStatus(alloc.room)}
                    title="Tap to toggle between Occupied and Available"
                  >
                    <span className="acc-rc-dot" />
                    <span>{isOccupied ? 'Occupied' : 'Available'}</span>
                  </button>
                </div>

                {/* Guest Name Section */}
                <div className="acc-rc-body">
                  <span className="acc-rc-label">Guest Allocation:</span>
                  <div className="acc-rc-guest">
                    {isOccupied ? (
                      <strong>{alloc.guest_name || 'Occupied (Name not set)'}</strong>
                    ) : (
                      <em className="acc-rc-vacant">Vacant / Available</em>
                    )}
                  </div>
                </div>

                {/* Stay Dates & Timings */}
                <div className="acc-rc-dates">
                  <div className="acc-rc-date-item">
                    <span className="acc-rc-sublabel">Dates</span>
                    <span className="acc-rc-date-val">
                      {formatDateShort(alloc.check_in)} → {formatDateShort(alloc.check_out)}
                      {nights ? ` (${nights}n)` : ''}
                    </span>
                  </div>
                  <div className="acc-rc-timing-item">
                    <span className="acc-rc-sublabel">Times</span>
                    <span className="acc-rc-timing-val">
                      In {CHECK_IN_TIME} · Out {CHECK_OUT_TIME}
                    </span>
                  </div>
                </div>

                {/* Dynamic Actions */}
                <div className="acc-rc-actions">
                  <button
                    type="button"
                    className="gold-button acc-rc-edit-btn"
                    onClick={() =>
                      setActiveAllocationDialog({
                        property,
                        room: alloc.room,
                        currentAllocation: alloc,
                      })
                    }
                  >
                    ✏️ {isOccupied ? 'Edit Allocation' : 'Allocate Room'}
                  </button>

                  {isOccupied && (
                    <button
                      type="button"
                      className="acc-rc-clear-btn"
                      disabled={isBusy}
                      onClick={() =>
                        setConfirmClearDialog({
                          propertyId,
                          room: alloc.room,
                          guestName: alloc.guest_name,
                        })
                      }
                      title="Clear guest and mark Available"
                    >
                      Free Room
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Room Allocation Dialog */}
      {activeAllocationDialog && (
        <RoomAllocationDialog
          open={Boolean(activeAllocationDialog)}
          property={activeAllocationDialog.property}
          room={activeAllocationDialog.room}
          currentAllocation={activeAllocationDialog.currentAllocation}
          onClose={() => setActiveAllocationDialog(null)}
          onSave={handleSaveAllocation}
          onClear={handleClearRoom}
        />
      )}

      {/* Change Host PIN Dialog */}
      <ChangePinDialog
        open={showChangePin}
        onClose={() => setShowChangePin(false)}
        onSuccess={() => showToast('🔑 Host PIN updated successfully!')}
      />

      {/* Confirm Free Room Dialog */}
      {confirmClearDialog && (
        <ConfirmDialog
          open={Boolean(confirmClearDialog)}
          title={`Free Room ${confirmClearDialog.room}?`}
          message={`Are you sure you want to clear "${confirmClearDialog.guestName || 'guest'}" from Room ${confirmClearDialog.room} and mark it Available?`}
          confirmLabel="Yes, Free Room"
          cancelLabel="Cancel"
          onConfirm={async () => {
            await handleClearRoom(confirmClearDialog.propertyId, confirmClearDialog.room);
          }}
          onClose={() => setConfirmClearDialog(null)}
        />
      )}
    </section>
  );
}

export default HostDashboard;
