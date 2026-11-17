import type { AuditLogRecord } from '@repo/types';

export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

/**
 * Returns a human-friendly actor display name for export.
 */
export function formatLogActor(log: AuditLogRecord): string {
  if (log.actorFirstName && log.actorLastName) {
    return `${log.actorFirstName} ${log.actorLastName}`;
  }
  return log.actorEmail || (log.actorType === 'agent' ? 'Agent' : 'System');
}

/**
 * Safely normalizes date/timestamp into an ISO string.
 */
export function formatTimestamp(timestamp: string | Date): string {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return String(timestamp);
}

/**
 * Escapes a cell value for RFC 4180 CSV compliance.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'object') {
    const json = JSON.stringify(value).replace(/"/g, '""');
    return `"${json}"`;
  }
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string with UTF-8 BOM.
 */
export function generateCsv(logs: AuditLogRecord[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Action',
    'Resource Type',
    'Resource ID',
    'Actor Type',
    'Actor Name',
    'Actor Email',
  ];

  const rows = logs.map((log) => [
    escapeCsvCell(log.id),
    escapeCsvCell(formatTimestamp(log.timestamp)),
    escapeCsvCell(log.action.toUpperCase()),
    escapeCsvCell(log.resourceType),
    escapeCsvCell(log.resourceId),
    escapeCsvCell(log.actorType),
    escapeCsvCell(formatLogActor(log)),
    escapeCsvCell(log.actorEmail || ''),
  ]);

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 encoded text cleanly
  return (
    '\uFEFF' +
    [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n')
  );
}

/**
 * Generates formatted JSON string.
 */
export function generateJson(logs: AuditLogRecord[]): string {
  return JSON.stringify(logs, null, 2);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an Excel-compatible XML/HTML spreadsheet workbook.
 */
export function generateExcel(logs: AuditLogRecord[]): string {
  const rowsHtml = logs
    .map(
      (log) => `
      <tr>
        <td>${escapeHtml(log.id)}</td>
        <td>${escapeHtml(formatTimestamp(log.timestamp))}</td>
        <td>${escapeHtml(log.action.toUpperCase())}</td>
        <td>${escapeHtml(log.resourceType)}</td>
        <td>${escapeHtml(log.resourceId)}</td>
        <td>${escapeHtml(log.actorType)}</td>
        <td>${escapeHtml(formatLogActor(log))}</td>
        <td>${escapeHtml(log.actorEmail || '')}</td>
      </tr>`,
    )
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Audit Logs</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #2563eb; color: #ffffff; font-weight: bold; border: 1px solid #1d4ed8; padding: 6px 12px; }
          td { border: 1px solid #e2e8f0; padding: 4px 8px; vertical-align: top; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Resource ID</th>
              <th>Actor Type</th>
              <th>Actor Name</th>
              <th>Actor Email</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `.trim();
}

/**
 * Minimalist, dependency-free PDF 1.4 writer for generating clean tabular governance reports.
 */
class SimplePdfWriter {
  public objects: string[] = [];

  addObject(content: string): number {
    this.objects.push(content);
    return this.objects.length; // 1-based object ID
  }

  build(): Uint8Array {
    let output = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(output.length);
      output += `${i + 1} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const startXref = output.length;
    output += `xref\n0 ${this.objects.length + 1}\n`;
    output += '0000000000 65535 f \n';

    for (let i = 1; i <= this.objects.length; i++) {
      const offsetStr = String(offsets[i]).padStart(10, '0');
      output += `${offsetStr} 00000 n \n`;
    }

    output += `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\n`;
    output += `startxref\n${startXref}\n%%EOF\n`;

    return new TextEncoder().encode(output);
  }
}

function sanitizePdfText(str: string, maxLength = 35): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics/accents
    .replace(/[—–]/g, '-') // convert em-dash and en-dash to standard ASCII hyphen
    .replace(/[“”]/g, '"') // convert smart double quotes
    .replace(/[‘’]/g, "'") // convert smart single quotes
    .replace(/…/g, '...') // convert ellipsis
    .replace(/[^\x20-\x7E]/g, ' ') // replace any remaining non-ASCII characters with space
    .replace(/[\r\n\t]/g, ' ') // replace control whitespace
    .replace(/\\/g, '\\\\') // escape PDF backslash
    .replace(/\(/g, '\\(') // escape PDF left paren
    .replace(/\)/g, '\\)') // escape PDF right paren
    .slice(0, maxLength);
}

/**
 * Generates an authentic, multi-page vector PDF 1.4 report of audit logs.
 */
export function generatePdf(
  logs: AuditLogRecord[],
  title = 'Headless CMS - Audit Log Governance Report',
): Uint8Array {
  const writer = new SimplePdfWriter();

  // 1: Catalog
  writer.addObject('<< /Type /Catalog /Pages 2 0 R >>');
  // 2: Pages placeholder (will be replaced after creating pages)
  const pagesIdx = writer.addObject('PLACEHOLDER_PAGES');
  // 3: Helvetica regular
  const f1Idx = writer.addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  );
  // 4: Helvetica-Bold
  const f2Idx = writer.addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  );

  const rowsPerPage = 22;
  const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));
  const pageObjIds: number[] = [];

  for (let p = 0; p < totalPages; p++) {
    const pageStart = p * rowsPerPage;
    const pageEnd = Math.min(pageStart + rowsPerPage, logs.length);
    const streamCmds: string[] = [];

    const now = new Date();
    const nowStr = `${now.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}, ${now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    // Title & Header info
    streamCmds.push(
      `BT /F2 15 Tf 0.1 0.1 0.1 rg 50 550 Td (${sanitizePdfText(title, 80)}) Tj ET`,
    );
    streamCmds.push(
      `BT /F1 9 Tf 0.4 0.4 0.4 rg 50 535 Td (Generated: ${nowStr}  |  Total Records: ${logs.length}) Tj ET`,
    );
    streamCmds.push(
      `BT /F1 9 Tf 0.4 0.4 0.4 rg 730 535 Td (Page ${p + 1} of ${totalPages}) Tj ET`,
    );

    // Table Header Box (Primary CMS Blue)
    streamCmds.push('0.145 0.388 0.921 rg 50 500 742 20 re f');
    streamCmds.push('BT /F2 9 Tf 1 1 1 rg 58 506 Td (ACTION) Tj ET');
    streamCmds.push('BT /F2 9 Tf 1 1 1 rg 135 506 Td (RESOURCE) Tj ET');
    streamCmds.push('BT /F2 9 Tf 1 1 1 rg 245 506 Td (RESOURCE ID) Tj ET');
    streamCmds.push('BT /F2 9 Tf 1 1 1 rg 415 506 Td (ACTOR) Tj ET');
    streamCmds.push('BT /F2 9 Tf 1 1 1 rg 590 506 Td (TIMESTAMP) Tj ET');

    // Render Table Data Rows
    let y = 482;
    for (let rIdx = pageStart; rIdx < pageEnd; rIdx++) {
      const log = logs[rIdx];
      if (!log) continue;

      // Alternating row background
      if (rIdx % 2 === 1) {
        streamCmds.push(`0.96 0.96 0.96 rg 50 ${y - 3} 742 18 re f`);
      }

      const actionText = sanitizePdfText(log.action.toUpperCase(), 12);
      const resourceText = sanitizePdfText(log.resourceType, 20);
      const resourceIdText = sanitizePdfText(log.resourceId, 28);
      const actorText = sanitizePdfText(formatLogActor(log), 30);
      const logDate = new Date(log.timestamp);
      const formattedDate = isNaN(logDate.getTime())
        ? String(log.timestamp)
        : `${logDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}, ${logDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
      const timestampText = sanitizePdfText(formattedDate, 24);

      streamCmds.push(
        `BT /F2 8 Tf 0.1 0.1 0.1 rg 58 ${y + 2} Td (${actionText}) Tj ET`,
      );
      streamCmds.push(
        `BT /F1 8 Tf 0.2 0.2 0.2 rg 135 ${y + 2} Td (${resourceText}) Tj ET`,
      );
      streamCmds.push(
        `BT /F1 8 Tf 0.3 0.3 0.3 rg 245 ${y + 2} Td (${resourceIdText}) Tj ET`,
      );
      streamCmds.push(
        `BT /F1 8 Tf 0.2 0.2 0.2 rg 415 ${y + 2} Td (${actorText}) Tj ET`,
      );
      streamCmds.push(
        `BT /F1 8 Tf 0.4 0.4 0.4 rg 590 ${y + 2} Td (${timestampText}) Tj ET`,
      );

      y -= 19;
    }

    const streamData = streamCmds.join('\n');
    const contentIdx = writer.addObject(
      `<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream`,
    );
    const pageIdx = writer.addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${f1Idx} 0 R /F2 ${f2Idx} 0 R >> >> /Contents ${contentIdx} 0 R >>`,
    );
    pageObjIds.push(pageIdx);
  }

  // Update Pages Object with correct Kids references
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  writer.objects[pagesIdx - 1] =
    `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>`;

  return writer.build();
}

/**
 * Downloads a Blob as a file in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a string as a file in the browser.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

/**
 * Coordinates generating and triggering download for the given format.
 */
export function exportAuditLogs(
  format: ExportFormat,
  logs: AuditLogRecord[],
  filenamePrefix = 'audit-logs',
): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  switch (format) {
    case 'csv': {
      const csv = generateCsv(logs);
      downloadFile(
        csv,
        `${filenamePrefix}-${dateStr}.csv`,
        'text/csv;charset=utf-8;',
      );
      break;
    }
    case 'json': {
      const json = generateJson(logs);
      downloadFile(
        json,
        `${filenamePrefix}-${dateStr}.json`,
        'application/json;charset=utf-8;',
      );
      break;
    }
    case 'excel': {
      const excel = generateExcel(logs);
      downloadFile(
        excel,
        `${filenamePrefix}-${dateStr}.xls`,
        'application/vnd.ms-excel;charset=utf-8;',
      );
      break;
    }
    case 'pdf': {
      const pdfBytes = generatePdf(logs);
      downloadBlob(
        new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        `${filenamePrefix}-${dateStr}.pdf`,
      );
      break;
    }
  }
}
