let ioInstance = null;

export function setSocketIOInstance(io) {
  ioInstance = io;
  console.log('✓ Socket.IO instance registered for event broadcasting');
}

export function emitDataEvent(eventType, data) {
  if (!ioInstance) {
    console.warn('[SocketEvents] No socket.io instance available');
    return;
  }

  try {
    ioInstance.emit(eventType, data);
    console.log(`[SocketEvents] Emitted ${eventType}:`, data);
  } catch (err) {
    console.error(`[SocketEvents] Error emitting ${eventType}:`, err);
  }
}

export const DataEvents = {
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_DELETED: 'booking:deleted',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_UPDATED: 'invoice:updated',
  STATS_CHANGED: 'stats:changed',
  CLIENT_UPDATED: 'client:updated',
  SERVICE_UPDATED: 'service:updated'
};

export function emitBookingCreated(booking) {
  emitDataEvent(DataEvents.BOOKING_CREATED, { booking });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitBookingUpdated(booking) {
  emitDataEvent(DataEvents.BOOKING_UPDATED, { booking });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitBookingStatusChanged(bookingId, status, staffId, businessId) {
  emitDataEvent(DataEvents.BOOKING_UPDATED, { 
    booking: { id: bookingId, status, staffId, businessId }
  });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitBookingDeleted(bookingId) {
  emitDataEvent(DataEvents.BOOKING_DELETED, { bookingId });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'bookings' });
}

export function emitInvoiceCreated(invoice) {
  emitDataEvent(DataEvents.INVOICE_CREATED, { invoice });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'invoices' });
}

export function emitInvoiceUpdated(invoice) {
  emitDataEvent(DataEvents.INVOICE_UPDATED, { invoice });
  emitDataEvent(DataEvents.STATS_CHANGED, { scope: 'invoices' });
}

export function emitStatsChanged(scope = 'all') {
  emitDataEvent(DataEvents.STATS_CHANGED, { scope });
}
