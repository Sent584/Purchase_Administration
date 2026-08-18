import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorBanner, PageSpinner } from '../../components/ui/Feedback';
import { configApi } from '../../lib/configApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { OtpPolicy, PasswordPolicy } from '../../types/api';

function SavedTick({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-xs font-medium text-emerald-600">Saved</span>;
}

export function GlobalConfigPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('config:write'));
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['config'], queryFn: configApi.get });

  const [general, setGeneral] = useState({
    app_name: '',
    org_short_name: '',
    default_state: '',
    helpdesk_email: '',
    helpdesk_phone: '',
    website: '',
    data_retention_years: 7,
    max_concurrent_sessions: 3,
  });
  const [requireOtpOnLogin, setRequireOtpOnLogin] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);
  const [otpPolicy, setOtpPolicy] = useState<OtpPolicy | null>(null);
  const [savedFlag, setSavedFlag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setGeneral({
      app_name: data.app_name,
      org_short_name: data.org_short_name,
      default_state: data.default_state,
      helpdesk_email: data.helpdesk_email,
      helpdesk_phone: data.helpdesk_phone,
      website: data.website,
      data_retention_years: data.data_retention_years,
      max_concurrent_sessions: data.max_concurrent_sessions,
    });
    setPasswordPolicy(data.password_policy);
    setOtpPolicy(data.otp_policy);
    setRequireOtpOnLogin(data.require_otp_on_login);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => configApi.update(patch),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      const section = Object.keys(variables)[0];
      setSavedFlag(section);
      setTimeout(() => setSavedFlag(null), 2000);
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (isLoading || !passwordPolicy || !otpPolicy) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Global Configuration</h1>
        <p className="text-sm text-ink-500">
          Version {data?.version} · effective from {data?.effective_from ? new Date(data.effective_from).toLocaleString('en-IN') : '—'}
        </p>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <div className="flex items-center gap-2">
            <SavedTick show={savedFlag === 'app_name'} />
            {canWrite && (
              <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate({ ...general })}>
                Save
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Application name" value={general.app_name} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, app_name: e.target.value })} />
          <TextField label="Organisation short name" value={general.org_short_name} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, org_short_name: e.target.value })} />
          <TextField label="Default state" value={general.default_state} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, default_state: e.target.value })} />
          <TextField label="Website" value={general.website} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, website: e.target.value })} />
          <TextField label="Helpdesk email" type="email" value={general.helpdesk_email} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, helpdesk_email: e.target.value })} />
          <TextField label="Helpdesk phone" value={general.helpdesk_phone} disabled={!canWrite} onChange={(e) => setGeneral({ ...general, helpdesk_phone: e.target.value })} />
          <TextField
            label="Data retention (years)"
            type="number"
            value={general.data_retention_years}
            disabled={!canWrite}
            onChange={(e) => setGeneral({ ...general, data_retention_years: Number(e.target.value) })}
          />
          <TextField
            label="Max concurrent sessions"
            type="number"
            value={general.max_concurrent_sessions}
            disabled={!canWrite}
            onChange={(e) => setGeneral({ ...general, max_concurrent_sessions: Number(e.target.value) })}
            hint="Oldest session is auto-revoked beyond this limit"
          />
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Login Security</CardTitle>
          <div className="flex items-center gap-2">
            <SavedTick show={savedFlag === 'require_otp_on_login'} />
            {canWrite && (
              <Button
                size="sm"
                loading={mutation.isPending}
                onClick={() => mutation.mutate({ require_otp_on_login: requireOtpOnLogin })}
              >
                Save
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <label className="flex items-start gap-3 rounded-lg border border-ink-200 p-3">
            <input
              type="checkbox"
              className="mt-0.5"
              disabled={!canWrite}
              checked={requireOtpOnLogin}
              onChange={(e) => setRequireOtpOnLogin(e.target.checked)}
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                Require OTP after password login
                <Badge tone={requireOtpOnLogin ? 'success' : 'warning'}>{requireOtpOnLogin ? 'Enabled' : 'Disabled'}</Badge>
              </span>
              <span className="mt-1 block text-xs text-ink-500">
                When off, a correct password signs the user straight in — no second-factor OTP step. Forgot-password
                resets and OTP-only accounts always require an OTP regardless of this setting. Off by default;
                institution/super administrators can turn this back on here at any time.
              </span>
            </span>
          </label>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <div className="flex items-center gap-2">
            <SavedTick show={savedFlag === 'password_policy'} />
            {canWrite && (
              <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate({ password_policy: passwordPolicy })}>
                Save
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Minimum length"
            type="number"
            value={passwordPolicy.min_length}
            disabled={!canWrite}
            onChange={(e) => setPasswordPolicy({ ...passwordPolicy, min_length: Number(e.target.value) })}
          />
          <TextField
            label="Password history (reuse prevention)"
            type="number"
            value={passwordPolicy.history_count}
            disabled={!canWrite}
            onChange={(e) => setPasswordPolicy({ ...passwordPolicy, history_count: Number(e.target.value) })}
          />
          <TextField
            label="Expiry (days)"
            type="number"
            value={passwordPolicy.expiry_days}
            disabled={!canWrite}
            onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expiry_days: Number(e.target.value) })}
          />
          <div className="flex flex-col justify-center gap-2 rounded-lg border border-ink-200 p-3 sm:col-span-2">
            {(
              [
                ['require_uppercase', 'Require uppercase letter'],
                ['require_lowercase', 'Require lowercase letter'],
                ['require_digit', 'Require digit'],
                ['require_special', 'Require special character'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  disabled={!canWrite}
                  checked={passwordPolicy[key]}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Email OTP Policy</CardTitle>
          <div className="flex items-center gap-2">
            <SavedTick show={savedFlag === 'otp_policy'} />
            {canWrite && (
              <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate({ otp_policy: otpPolicy })}>
                Save
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="OTP length" type="number" value={otpPolicy.length} disabled={!canWrite} onChange={(e) => setOtpPolicy({ ...otpPolicy, length: Number(e.target.value) })} />
          <TextField
            label="Validity (minutes)"
            type="number"
            value={otpPolicy.validity_minutes}
            disabled={!canWrite}
            onChange={(e) => setOtpPolicy({ ...otpPolicy, validity_minutes: Number(e.target.value) })}
          />
          <TextField
            label="Resend cooldown (seconds)"
            type="number"
            value={otpPolicy.resend_cooldown_seconds}
            disabled={!canWrite}
            onChange={(e) => setOtpPolicy({ ...otpPolicy, resend_cooldown_seconds: Number(e.target.value) })}
          />
          <TextField
            label="Max verify attempts"
            type="number"
            value={otpPolicy.max_attempts}
            disabled={!canWrite}
            onChange={(e) => setOtpPolicy({ ...otpPolicy, max_attempts: Number(e.target.value) })}
          />
          <TextField
            label="Max resends"
            type="number"
            value={otpPolicy.max_resends}
            disabled={!canWrite}
            onChange={(e) => setOtpPolicy({ ...otpPolicy, max_resends: Number(e.target.value) })}
          />
          <TextField
            label="Lockout duration (minutes)"
            type="number"
            value={otpPolicy.lockout_duration_minutes}
            disabled={!canWrite}
            onChange={(e) => setOtpPolicy({ ...otpPolicy, lockout_duration_minutes: Number(e.target.value) })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Numbering</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-2">Document type</th>
                  <th className="pb-2">Prefix</th>
                  <th className="pb-2">Financial year</th>
                  <th className="pb-2">Padding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data && Object.entries(data.document_numbering).map(([key, rule]) => (
                  <tr key={key}>
                    <td className="py-2 capitalize text-ink-800">{key.replace(/_/g, ' ')}</td>
                    <td className="py-2 font-mono text-ink-600">{rule.prefix}</td>
                    <td className="py-2 text-ink-600">{rule.use_financial_year ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-ink-600">{rule.padding} digits</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Example: {data?.document_numbering.purchase_order.prefix}/2026-27/{'0'.repeat((data?.document_numbering.purchase_order.padding ?? 4) - 1)}1
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
