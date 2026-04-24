import { api } from './api';

// POST /payments/{bookingId}/initiate — inicjuj płatność
export const initiatePayment = (bookingId: number) =>
  api.post(`/payments/${bookingId}/initiate`, {});

// POST /payments/{bookingId}/emulate-pay — emulacja płatności (jedno kliknięcie)
export const emulatePayment = (bookingId: number) =>
  api.post(`/payments/${bookingId}/emulate-pay`, {});

// GET /payments/{bookingId}/status — status płatności
export const getPaymentStatus = (bookingId: number) =>
  api.get(`/payments/${bookingId}/status`);

// GET /payments/me — moje płatności
export const getMyPayments = () => api.get('/payments/me');
