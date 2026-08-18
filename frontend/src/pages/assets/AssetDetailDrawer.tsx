import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { EmptyState, ErrorBanner } from '../../components/ui/Feedback';
import { assetsApi } from '../../lib/assetsApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { AssetOut } from '../../types/assets';
import { AssetProcurementPanel } from './AssetProcurementPanel';
import { assetStatusTone, classLabel, formatInr } from './assetHelpers';

export function AssetDetailDrawer({ asset, onClose }: { asset: AssetOut | null; onClose: () => void }) {
  const canTransfer = useAuthStore((s) => s.hasPermission('assets:transfer'));
  const canDispose = useAuthStore((s) => s.hasPermission('assets:dispose'));
  const queryClient = useQueryClient();
  const [custodian, setCustodian] = useState(asset?.custodian_name ?? '');
  const [building, setBuilding] = useState(asset?.location_building ?? '');
  const [room, setRoom] = useState(asset?.location_room ?? '');
  const [saleValue, setSaleValue] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['assets'] });

  const transferMutation = useMutation({
    mutationFn: () =>
      assetsApi.transfer(asset!.id, {
        custodian_name: custodian,
        location_building: building,
        location_floor: asset?.location_floor ?? '',
        location_room: room,
        remarks: 'Custody/location transfer',
      }),
    onSuccess: () => { refresh(); onClose(); },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const disposeMutation = useMutation({
    mutationFn: () => assetsApi.dispose(asset!.id, { sale_value: saleValue, reason }),
    onSuccess: () => { refresh(); onClose(); },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (!asset) {
    return <EmptyState title="Select an asset" description="Click a row to view details, transfer or dispose." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge tone={assetStatusTone(asset.status)}>{asset.status}</Badge>
          <Badge tone="info">{classLabel(asset.asset_class)}</Badge>
        </div>
        {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
        <dl className="mt-4 divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Campus</dt><dd className="text-ink-900">{asset.campus_name || '—'}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Division</dt><dd className="text-ink-900">{asset.division_name || '—'}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Department</dt><dd className="text-ink-900">{asset.department_name || '—'}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Make / Model</dt><dd className="text-ink-900">{asset.make} {asset.model}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Serial</dt><dd className="font-mono text-ink-900">{asset.serial_number || '—'}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Capitalization</dt><dd className="text-ink-900">{formatInr(asset.capitalization_value)}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Book value</dt><dd className="text-ink-900">{formatInr(asset.current_book_value)}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Custodian</dt><dd className="text-ink-900">{asset.custodian_name || '—'}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-ink-500">Location</dt><dd className="text-right text-ink-900">{asset.location_building} {asset.location_room}</dd></div>
        </dl>
      </div>

      <AssetProcurementPanel assetId={asset.id} />

      {canTransfer && asset.status !== 'disposed' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Transfer</p>
          <TextField label="New custodian" value={custodian} onChange={(e) => setCustodian(e.target.value)} />
          <TextField label="Building" value={building} onChange={(e) => setBuilding(e.target.value)} />
          <TextField label="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <Button size="sm" loading={transferMutation.isPending} onClick={() => transferMutation.mutate()}>Transfer</Button>
        </div>
      )}

      {canDispose && asset.status !== 'disposed' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Dispose</p>
          <TextField label="Sale value (₹)" type="number" value={saleValue} onChange={(e) => setSaleValue(Number(e.target.value))} />
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="sm" variant="danger" loading={disposeMutation.isPending} disabled={!reason} onClick={() => disposeMutation.mutate()}>
            Dispose asset
          </Button>
        </div>
      )}
    </div>
  );
}
