import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AuditLogRecord } from '@repo/types';
import {
  escapeCsvCell,
  formatLogActor,
  formatTimestamp,
  generateCsv,
  generateJson,
  generateExcel,
  generatePdf,
  exportAuditLogs,
} from '@/components/audit-log/audit-export-utils';

const sampleLog1: AuditLogRecord = {
  id: 'log-001',
  applicationId: 'app-001',
  actorType: 'user',
  actorUserId: 'user-001',
  action: 'create',
  resourceType: 'content',
  resourceId: 'article-123',
  beforeState: null,
  afterState: { title: 'New Post' },
  context: { ip: '127.0.0.1' },
  timestamp: '2026-11-06T12:00:00.000Z',
  actorEmail: 'admin@example.com',
  actorFirstName: 'Admin',
  actorLastName: 'User',
};

const sampleLog2: AuditLogRecord = {
  id: 'log-002',
  applicationId: 'app-001',
  actorType: 'agent',
  actorAgentId: 'agent-ai',
  action: 'update',
  resourceType: 'schema',
  resourceId: 'schema-456',
  beforeState: { field: 'old' },
  afterState: { field: 'new, "quoted"' },
  context: null,
  timestamp: '2026-11-06T12:30:00.000Z',
  actorEmail: null,
  actorFirstName: null,
  actorLastName: null,
};

const sampleLogs: AuditLogRecord[] = [sampleLog1, sampleLog2];

describe('audit-export-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatLogActor', () => {
    it('returns combined first and last name when present', () => {
      expect(formatLogActor(sampleLog1)).toBe('Admin User');
    });

    it('returns actorType Agent when names and email are missing for agent actor', () => {
      expect(formatLogActor(sampleLog2)).toBe('Agent');
    });

    it('returns actorEmail when name is missing', () => {
      const logWithEmailOnly: AuditLogRecord = {
        ...sampleLog1,
        actorFirstName: null,
        actorLastName: null,
        actorEmail: 'editor@example.com',
      };
      expect(formatLogActor(logWithEmailOnly)).toBe('editor@example.com');
    });
  });

  describe('formatTimestamp', () => {
    it('formats string timestamp as-is and Date object as ISO string', () => {
      expect(formatTimestamp('2026-11-06T12:00:00.000Z')).toBe(
        '2026-11-06T12:00:00.000Z',
      );
      const date = new Date('2026-11-06T12:00:00.000Z');
      expect(formatTimestamp(date)).toBe('2026-11-06T12:00:00.000Z');
    });
  });

  describe('escapeCsvCell', () => {
    it('returns double quotes for null or undefined', () => {
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });

    it('escapes internal quotes by doubling them', () => {
      expect(escapeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
    });

    it('serializes objects and escapes quotes', () => {
      expect(escapeCsvCell({ a: '1' })).toBe('"{""a"":""1""}"');
    });
  });

  describe('generateCsv', () => {
    it('prepends UTF-8 BOM and formats headers and rows', () => {
      const csv = generateCsv(sampleLogs);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain(
        '"ID","Timestamp","Action","Resource Type","Resource ID","Actor Type","Actor Name","Actor Email"',
      );
      expect(csv).toContain('"log-001"');
      expect(csv).toContain('"CREATE"');
      expect(csv).toContain('"Admin User"');
      expect(csv).toContain('"log-002"');
      expect(csv).toContain('"UPDATE"');
      expect(csv).toContain('"Agent"');
    });
  });

  describe('generateJson', () => {
    it('generates formatted JSON matching the input logs', () => {
      const jsonStr = generateJson(sampleLogs);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('log-001');
      expect(parsed[1].id).toBe('log-002');
    });
  });

  describe('generateExcel', () => {
    it('generates an XML/HTML table with Excel namespace and log rows', () => {
      const excel = generateExcel(sampleLogs);
      expect(excel).toContain('urn:schemas-microsoft-com:office:excel');
      expect(excel).toContain('<td>log-001</td>');
      expect(excel).toContain('<td>CREATE</td>');
      expect(excel).toContain('<td>Admin User</td>');
      expect(excel).toContain('<td>log-002</td>');
      expect(excel).toContain('<td>UPDATE</td>');
    });
  });

  describe('generatePdf', () => {
    it('generates a valid binary PDF 1.4 document with catalog, pages, and EOF marker', () => {
      const pdfBytes = generatePdf(sampleLogs);
      const pdfStr = new TextDecoder('latin1').decode(pdfBytes);

      expect(pdfStr.startsWith('%PDF-1.4')).toBe(true);
      expect(pdfStr.endsWith('%%EOF\n')).toBe(true);
      expect(pdfStr).toContain('/Type /Catalog');
      expect(pdfStr).toContain('/Type /Pages');
      expect(pdfStr).toContain('Audit Log Governance Report');
      expect(pdfStr).toContain('CREATE');
      expect(pdfStr).toContain('content');
    });

    it('handles multi-page generation when records exceed page capacity', () => {
      // 25 logs should span across 2 pages (capacity is 22 per page)
      const manyLogs: AuditLogRecord[] = Array.from({ length: 25 }, (_, i) => ({
        ...sampleLog1,
        id: `log-multi-${i + 1}`,
        resourceId: `res-${i + 1}`,
      }));

      const pdfBytes = generatePdf(manyLogs);
      const pdfStr = new TextDecoder('latin1').decode(pdfBytes);

      expect(pdfStr).toContain('/Count 2');
      expect(pdfStr).toContain('Page 1 of 2');
      expect(pdfStr).toContain('Page 2 of 2');
    });

    it('sanitizes unicode characters such as em-dashes and smart quotes to clean ASCII without tofu characters', () => {
      const logsWithUnicode: AuditLogRecord[] = [
        {
          ...sampleLog1,
          resourceId: 'article—with—em-dash and “quotes”',
        },
      ];
      const pdfBytes = generatePdf(
        logsWithUnicode,
        'Agentic Headless CMS — Audit Log Governance Report',
      );
      const pdfStr = new TextDecoder('latin1').decode(pdfBytes);

      // Must not contain multi-byte em-dash UTF-8 artifacts like â
      expect(pdfStr).not.toContain('â');
      expect(pdfStr).toContain(
        'Agentic Headless CMS - Audit Log Governance Report',
      );
    });
  });

  describe('exportAuditLogs', () => {
    it('creates blob and triggers anchor download for CSV, JSON, Excel, and PDF', () => {
      const mockClick = vi.fn();
      const mockAppendChild = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => document.createElement('a'));
      const mockRemoveChild = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => document.createElement('a'));

      // Mock createElement for anchor
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(
        (tagName: string) => {
          if (tagName === 'a') {
            return {
              href: '',
              download: '',
              click: mockClick,
            } as unknown as HTMLAnchorElement;
          }
          return originalCreateElement(tagName);
        },
      );

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      exportAuditLogs('csv', sampleLogs);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      exportAuditLogs('json', sampleLogs);
      expect(mockClick).toHaveBeenCalledTimes(2);

      exportAuditLogs('excel', sampleLogs);
      expect(mockClick).toHaveBeenCalledTimes(3);

      exportAuditLogs('pdf', sampleLogs);
      expect(mockClick).toHaveBeenCalledTimes(4);

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });
});
