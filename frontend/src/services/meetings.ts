import { api } from './api';

/**
 * Serwis do zarządzania spotkaniami Zoom powiązanymi z rezerwacjami.
 */

// GET /meetings/{bookingId} — pobierz informacje o spotkaniu
export const getMeeting = (bookingId: number) =>
  api.get(`/meetings/${bookingId}`);

// POST /meetings/{bookingId} — wygeneruj (lub odśwież) link Zoom
export const generateMeeting = (bookingId: number) =>
  api.post(`/meetings/${bookingId}`, {});

// DELETE /meetings/{bookingId} — usuń spotkanie Zoom
export const deleteMeeting = (bookingId: number) =>
  api.delete(`/meetings/${bookingId}`);
