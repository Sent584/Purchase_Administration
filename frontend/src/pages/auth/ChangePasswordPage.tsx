import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorBanner } from '../../components/ui/Feedback';
import { SasurieLogo } from '../../components/brand/SasurieLogo';
import { authApi } from '../../lib/authApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      if (user) setUser({ ...user, must_change_password: false });
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <SasurieLogo className="h-10 w-10 object-contain" />
          <div>
            <p className="text-base font-semibold text-ink-900">Set a new password</p>
            <p className="text-xs text-ink-500">Required before you can continue</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-ink-500">
          This is your first sign-in (or your password was reset by an administrator). Choose a new password to
          continue to Sasurie ERP.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextField
            label="Current / temporary password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
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
            Set password and continue
          </Button>
        </form>
      </div>
    </div>
  );
}
