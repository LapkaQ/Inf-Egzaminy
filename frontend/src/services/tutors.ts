import { api } from './api';

// GET /tutors/all — lista wszystkich tutorów (UserResponse[])
export const getAllTutors = () => api.get('/tutors/all');

// GET /tutors/{user_id} — profil tutora (TutorProfileResponse)
export const getTutorById = (userId: number) => api.get(`/tutors/${userId}`);

// GET /availability/search/slots — wolne sloty opcjonalnie filtrowane
export const searchSlots = (tutorProfileId?: number, subject?: string) => {
  const params = new URLSearchParams();
  if (tutorProfileId) params.set('tutor_profile_id', tutorProfileId.toString());
  if (subject) params.set('subject', subject);
  const qs = params.toString();
  return api.get(`/availability/search/slots${qs ? `?${qs}` : ''}`);
};

// GET /availability/{tutor_profile_id} — sloty danego tutora
export const getTutorSlots = (tutorProfileId: number) =>
  api.get(`/availability/${tutorProfileId}`);

// GET /availability/me — moje sloty (tylko tutor)
export const getMySlots = () => api.get('/availability/me');

// POST /availability/ — dodaj slot
export const addSlot = (start_time: string, end_time: string) =>
  api.post('/availability/', { start_time, end_time });

// DELETE /availability/{slot_id}
export const deleteSlot = (slotId: number) =>
  api.delete(`/availability/${slotId}`);

// GET /bookings/me — moje bookings (student i tutor)
export const getMyBookings = () => api.get('/bookings/me');

// POST /bookings/ — utwórz booking
export const createBooking = (availability_slot_id: number) =>
  api.post('/bookings/', { availability_slot_id });

// PATCH /bookings/{id}/cancel
export const cancelBooking = (bookingId: number) =>
  api.patch(`/bookings/${bookingId}/cancel`, {});

// POST /tutors/profile — stwórz profil tutora
export const createTutorProfile = (bio: string, price_per_hour: number, subjects: string[]) =>
  api.post('/tutors/profile', { bio, price_per_hour, subjects });

// PATCH /tutors/profile — zaktualizuj profil tutora
export const updateTutorProfile = (data: { bio?: string; price_per_hour?: number; subjects?: string[] }) =>
  api.patch('/tutors/profile', data);
