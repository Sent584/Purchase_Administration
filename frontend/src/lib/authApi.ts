import { api } from './api';
import type { ChallengeResponse, SessionOut, TokenResponse } from '../types/api';

export const authApi = {
  // Returns a TokenResponse directly if Global Configuration has the OTP-after-password
  // step turned off; otherwise a ChallengeResponse, same as every other login path.
  loginPassword: (email: string, password: string) =>
    api.post<ChallengeResponse | TokenResponse>('/auth/login/password', { email, password }).then((r) => r.data),

  loginOtpOnly: (email: string) => api.post<ChallengeResponse>('/auth/login/otp-only', { email }).then((r) => r.data),

  resendOtp: (challenge_id: string) =>
    api.post<ChallengeResponse>('/auth/login/otp/resend', { challenge_id }).then((r) => r.data),

  verifyOtp: (challenge_id: string, otp: string) =>
    api.post<TokenResponse>('/auth/login/otp/verify', { challenge_id, otp }).then((r) => r.data),

  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }).then((r) => r.data),

  forgotPasswordRequest: (email: string) =>
    api.post<ChallengeResponse>('/auth/forgot-password/request', { email }).then((r) => r.data),

  forgotPasswordReset: (challenge_id: string, otp: string, new_password: string) =>
    api.post<{ message: string }>('/auth/forgot-password/reset', { challenge_id, otp, new_password }).then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api.post<{ message: string }>('/auth/change-password', { current_password, new_password }).then((r) => r.data),

  sessions: () => api.get<SessionOut[]>('/auth/sessions').then((r) => r.data),

  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`).then((r) => r.data),
};
