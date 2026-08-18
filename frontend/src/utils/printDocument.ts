function stylesheetHrefs(): string[] {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((el) => (el as HTMLLinkElement).href)
    .filter(Boolean);
}

async function inlineStylesheets(): Promise<string> {
  const chunks = await Promise.all(
    stylesheetHrefs().map(async (href) => {
      try {
        const res = await fetch(href);
        if (!res.ok) return '';
        return await res.text();
      } catch {
        return '';
      }
    }),
  );
  return chunks.join('\n');
}

const BASE_PRINT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f4f5; color: #18181b; font-family: system-ui, sans-serif; }
  .preview-toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 12px 16px; background: #fff; border-bottom: 1px solid #e4e4e7;
  }
  .preview-toolbar button {
    padding: 8px 14px; border-radius: 8px; border: 1px solid #d4d4d8;
    background: #fff; cursor: pointer; font-size: 14px;
  }
  .preview-toolbar button.primary {
    background: #7f1d1d; color: #fff; border-color: #7f1d1d;
  }
  .print-root {
    max-width: 900px; margin: 24px auto; padding: 24px;
    background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
  }
  @media print {
    body { background: #fff; }
    .preview-toolbar, .no-print, button { display: none !important; }
    .print-root { max-width: none; margin: 0; padding: 0; box-shadow: none; }
    @page { margin: 10mm; size: A4; }
  }
`;

function wrapHtml(title: string, bodyHtml: string, cssText: string): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>${BASE_PRINT_CSS}\n${cssText}</style>
</head>
<body>
  <div class="preview-toolbar">
    <button type="button" onclick="window.close()">Close</button>
    <button type="button" class="primary" onclick="window.print()">Print</button>
  </div>
  <div class="print-root">${bodyHtml}</div>
</body>
</html>`;
}

async function buildDocumentHtml(source: HTMLElement, title: string): Promise<string> {
  const bodyHtml = source.innerHTML;
  const cssText = await inlineStylesheets();
  return wrapHtml(title, bodyHtml, cssText);
}

/** Opens a printable preview in a new browser tab (not a popup window). */
export async function openPrintPreview(source: HTMLElement, title: string): Promise<void> {
  const html = await buildDocumentHtml(source, title);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  // No window features → browser opens a tab, not a sized popup.
  const tab = window.open(url, '_blank');
  if (!tab) {
    URL.revokeObjectURL(url);
    window.alert('Please allow pop-ups to open print preview.');
    return;
  }
  // Revoke after the tab has a chance to load the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocumentHtml(source: HTMLElement, fileName: string): Promise<void> {
  const safeName = fileName.replace(/[^\w.-]+/g, '_');
  const html = await buildDocumentHtml(source, fileName);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
