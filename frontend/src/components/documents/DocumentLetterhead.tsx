import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { orgApi } from '../../lib/orgApi';
import { SasurieLogo } from '../brand/SasurieLogo';

export function DocumentHeader({
  institutionId,
  documentTitle,
  documentNumber,
  documentDate,
  statusNode,
}: {
  institutionId: string;
  documentTitle: string;
  documentNumber: string;
  documentDate?: string;
  statusNode?: React.ReactNode;
}) {
  const { data: institution } = useQuery({
    queryKey: ['org', 'institution', institutionId],
    queryFn: () => orgApi.getInstitution(institutionId),
  });

  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-crimson-600/20 pb-4">
      <div className="flex items-start gap-3">
        <SasurieLogo className="h-12 w-12 shrink-0 object-contain" />
        <div>
          <p className="font-serif text-lg font-bold leading-tight text-crimson-700">Sasurie Group of Institutions</p>
          {institution && (
            <>
              <p className="text-sm font-medium text-ink-800">{institution.name}</p>
              <p className="text-xs text-ink-500">
                {institution.address.line1}, {institution.address.city}, {institution.address.state} {institution.address.pincode}
              </p>
              {institution.gstin && <p className="text-xs text-ink-400">GSTIN: {institution.gstin}</p>}
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-ink-400">{documentTitle}</p>
        <p className="font-mono text-sm font-semibold text-ink-900">{documentNumber}</p>
        {documentDate && <p className="text-xs text-ink-500">{new Date(documentDate).toLocaleDateString('en-IN')}</p>}
        {statusNode && <div className="mt-1">{statusNode}</div>}
      </div>
    </div>
  );
}

export function DocumentFooter({
  documentType,
  documentNumber,
  preparedBy,
  approvedBy,
}: {
  documentType: string;
  documentNumber: string;
  preparedBy?: string | null;
  approvedBy?: string | null;
}) {
  const verificationPayload = JSON.stringify({ org: 'SASURIE', type: documentType, no: documentNumber });

  return (
    <div className="mt-6 flex items-end justify-between gap-6 border-t border-ink-100 pt-4">
      <div className="flex gap-8">
        <div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-ink-300 text-[10px] uppercase text-ink-400">
            Seal
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1 text-xs">
          <div className="h-8 w-32 border-b border-ink-300" />
          <p className="text-ink-500">Prepared by{preparedBy ? `: ${preparedBy}` : ''}</p>
        </div>
        <div className="flex flex-col justify-end gap-1 text-xs">
          <div className="h-8 w-32 border-b border-ink-300" />
          <p className="text-ink-500">Authorised signatory{approvedBy ? `: ${approvedBy}` : ''}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="rounded-md border border-ink-200 bg-white p-1">
          <QRCodeSVG value={verificationPayload} size={64} level="M" />
        </div>
        <p className="text-[9px] uppercase tracking-wide text-ink-400">Scan to verify</p>
      </div>
    </div>
  );
}

export function DocumentDisclaimer() {
  return (
    <p className="mt-4 border-t border-dashed border-ink-200 pt-3 text-center text-[10px] text-ink-400">
      This is a system-generated document issued by Sasurie ERP. Confidential — for authorised institutional use only.
    </p>
  );
}
