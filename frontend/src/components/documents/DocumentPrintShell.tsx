import { useRef, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { downloadDocumentHtml, openPrintPreview } from '../../utils/printDocument';

/** Wraps printable document body and exposes Print Preview + Download. */
export function DocumentPrintShell({
  documentTitle,
  fileName,
  children,
}: {
  documentTitle: string;
  fileName: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (ref.current) void openPrintPreview(ref.current, documentTitle);
          }}
        >
          Print preview
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (ref.current) void downloadDocumentHtml(ref.current, fileName);
          }}
        >
          Download
        </Button>
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}
