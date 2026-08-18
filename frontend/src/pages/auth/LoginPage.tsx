import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorBanner } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { SasurieLogo } from '../../components/brand/SasurieLogo';
import { authApi } from '../../lib/authApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { isTokenResponse, type ChallengeResponse } from '../../types/api';

type Mode = 'password' | 'otp-only';
type Step = 'credentials' | 'otp' | 'forgot-request' | 'forgot-otp';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<Mode>('password');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = mode === 'password' ? await authApi.loginPassword(email, password) : await authApi.loginOtpOnly(email);
      if (isTokenResponse(res)) {
        // Global Configuration has the OTP-after-password step turned off — already logged in.
        setSession(res);
        navigate(res.user.must_change_password ? '/change-password' : '/', { replace: true });
        return;
      }
      setChallenge(res);
      setCooldown(res.resend_cooldown_seconds);
      setStep('otp');
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to sign in. Please check your details.'));
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.verifyOtp(challenge.challenge_id, otp);
      setSession(tokens);
      navigate(tokens.user.must_change_password ? '/change-password' : '/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Incorrect or expired OTP.'));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!challenge || cooldown > 0) return;
    setError(null);
    try {
      const res = await authApi.resendOtp(challenge.challenge_id);
      setChallenge(res);
      setCooldown(res.resend_cooldown_seconds);
      setInfo('A new OTP has been sent.');
      setTimeout(() => setInfo(null), 3000);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function submitForgotRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPasswordRequest(email);
      setChallenge(res);
      setCooldown(res.resend_cooldown_seconds);
      setInfo(`If an account exists for ${email}, a password reset OTP has been sent.`);
      setStep('forgot-otp');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function backToStart() {
    setStep('credentials');
    setError(null);
    setInfo(null);
    setOtp('');
    setChallenge(null);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-crimson-800 via-crimson-700 to-crimson-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5">
            <SasurieLogo className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Sasurie ERP</p>
            <p className="text-xs text-crimson-100/80">Sasurie Group of Institutions</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            One institutional platform for every campus, every department.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-crimson-100/90">
            Configuration, Purchase, Stores, Assets, HR, Attendance, Payroll and Accounts — unified across every
            Sasurie institution, with a single source of truth.
          </p>
        </div>

        <p className="relative text-xs text-crimson-200/70">
          © {new Date().getFullYear()} Sasurie Group of Institutions. Confidential — authorised use only.
        </p>
      </div>

      <div className="flex items-center justify-center bg-ink-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <SasurieLogo className="h-10 w-10 object-contain" />
            <div>
              <p className="text-base font-semibold text-ink-900">Sasurie ERP</p>
              <p className="text-xs text-ink-500">Sasurie Group of Institutions</p>
            </div>
          </div>

          {step === 'credentials' && (
            <>
              <h2 className="text-xl font-semibold text-ink-900">Sign in to your account</h2>
              <p className="mt-1 text-sm text-ink-500">
                Use your institutional email to continue{mode === 'password' ? ' with password + OTP' : ' with a one-time password'}.
              </p>

              <form onSubmit={submitCredentials} className="mt-6 flex flex-col gap-4">
                <TextField
                  label="Institutional email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@sasurie.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {mode === 'password' && (
                  <div className="relative">
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-9 text-ink-400 hover:text-ink-600"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {error && <ErrorBanner message={error} />}

                <Button type="submit" loading={loading} className="mt-1 w-full">
                  {mode === 'password' ? 'Continue' : 'Send one-time password'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'password' ? 'otp-only' : 'password')}
                    className="font-medium text-crimson-700 hover:text-crimson-800"
                  >
                    {mode === 'password' ? 'Sign in with OTP only' : 'Sign in with password'}
                  </button>
                  {mode === 'password' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('forgot-request');
                        setError(null);
                      }}
                      className="text-ink-500 hover:text-ink-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {step === 'otp' && challenge && (
            <>
              <button onClick={backToStart} className="mb-4 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                <Icon name="chevronDown" className="h-4 w-4 rotate-90" /> Back
              </button>
              <h2 className="text-xl font-semibold text-ink-900">Enter the OTP</h2>
              <p className="mt-1 text-sm text-ink-500">
                We sent a 6-digit code to <span className="font-medium text-ink-800">{challenge.masked_destination}</span>.
                It's valid for {Math.round(challenge.expires_in_seconds / 60)} minutes.
              </p>

              <form onSubmit={submitOtp} className="mt-6 flex flex-col gap-4">
                <TextField
                  label="One-time password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  className="text-center text-lg tracking-[0.5em]"
                />

                {info && <p className="text-sm text-emerald-600">{info}</p>}
                {error && <ErrorBanner message={error} />}

                <Button type="submit" loading={loading} className="w-full">
                  Verify and sign in
                </Button>

                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0}
                  className="text-sm font-medium text-crimson-700 hover:text-crimson-800 disabled:text-ink-400"
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </form>
            </>
          )}

          {step === 'forgot-request' && (
            <>
              <button onClick={backToStart} className="mb-4 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                <Icon name="chevronDown" className="h-4 w-4 rotate-90" /> Back to sign in
              </button>
              <h2 className="text-xl font-semibold text-ink-900">Reset your password</h2>
              <p className="mt-1 text-sm text-ink-500">Enter your institutional email and we'll send a reset OTP.</p>
              <form onSubmit={submitForgotRequest} className="mt-6 flex flex-col gap-4">
                <TextField label="Institutional email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {error && <ErrorBanner message={error} />}
                <Button type="submit" loading={loading} className="w-full">
                  Send reset OTP
                </Button>
              </form>
            </>
          )}

          {step === 'forgot-otp' && challenge && (
            <ForgotOtpStep challengeId={challenge.challenge_id} info={info} onDone={backToStart} />
          )}

          <p className="mt-10 text-center text-xs text-ink-400">
            By signing in you agree to Sasurie's acceptable use policy. All access is logged and audited.
          </p>
        </div>
      </div>
    </div>
  );
}

function ForgotOtpStep({ challengeId, info, onDone }: { challengeId: string; info: string | null; onDone: () => void }) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPasswordReset(challengeId, otp, newPassword);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reset password. Request a fresh OTP and try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon name="check" className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-ink-900">Password reset</h2>
        <p className="mt-1 text-sm text-ink-500">You can now sign in with your new password.</p>
        <Button onClick={onDone} className="mt-6 w-full">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-ink-900">Check your email</h2>
      <p className="mt-1 text-sm text-ink-500">{info}</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <TextField label="OTP" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required />
        <TextField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={loading} className="w-full">
          Reset password
        </Button>
        <button type="button" onClick={onDone} className="text-sm text-ink-500 hover:text-ink-700">
          Back to sign in
        </button>
      </form>
    </>
  );
}
