import { api } from './api';

export const getAdminOverview = () => api.get('/admin/overview');

export const getAdminBookings = (status?: string) => {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return api.get(`/admin/bookings${q}`);
};

export const patchAdminBooking = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/bookings/${id}`, data);

export const patchAdminSession = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/sessions/${id}`, data);

export const getAdminUsers = (role?: string) => {
  const q = role ? `?role=${encodeURIComponent(role)}` : '';
  return api.get(`/admin/users${q}`);
};

export const patchAdminUser = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/users/${id}`, data);

export const patchAdminTutorProfile = (userId: number, data: Record<string, unknown>) =>
  api.patch(`/admin/tutors/user/${userId}`, data);

export const promoteTutor = (userId: number) =>
  api.post(`/tutors/add?user_id=${userId}`, {});

export const demoteTutor = (userId: number) =>
  api.post(`/tutors/remove?user_id=${userId}`, {});
