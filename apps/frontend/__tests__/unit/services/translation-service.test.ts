import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decodeHtmlEntities,
  getTranslationConfig,
  isFieldTranslatable,
  normalizeLocaleCode,
  saveTranslationConfig,
  testTranslationProvider,
  translateContentEntry,
  translateText,
  translateRichTextContent,
  type TranslationConfig,
} from '@/lib/services/translation-service';

describe('translation-service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('normalizeLocaleCode', () => {
    it('normalizes locale strings to 2-letter ISO language codes', () => {
      expect(normalizeLocaleCode('en-US')).toBe('en');
      expect(normalizeLocaleCode('es_ES')).toBe('es');
      expect(normalizeLocaleCode('FR')).toBe('fr');
      expect(normalizeLocaleCode('')).toBe('en');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('decodes HTML entities returned by translation APIs', () => {
      expect(decodeHtmlEntities('&quot;Hello &amp; welcome&#39;')).toBe(
        '"Hello & welcome\'',
      );
      expect(decodeHtmlEntities('&lt;div&gt;Test&lt;/div&gt;')).toBe(
        '<div>Test</div>',
      );
    });
  });

  describe('isFieldTranslatable', () => {
    it('marks fields flagged as isLocalized as translatable', () => {
      expect(
        isFieldTranslatable({
          apiId: 'custom',
          dataType: 'custom',
          isLocalized: true,
        }),
      ).toBe(true);
    });

    it('marks text, textarea, and richtext fields as translatable', () => {
      expect(isFieldTranslatable({ apiId: 'title', dataType: 'text' })).toBe(
        true,
      );
      expect(isFieldTranslatable({ apiId: 'bio', dataType: 'textarea' })).toBe(
        true,
      );
      expect(isFieldTranslatable({ apiId: 'body', dataType: 'richtext' })).toBe(
        true,
      );
    });

    it('returns false for non-text fields unless explicitly localized', () => {
      expect(isFieldTranslatable({ apiId: 'views', dataType: 'number' })).toBe(
        false,
      );
      expect(
        isFieldTranslatable({ apiId: 'isActive', dataType: 'boolean' }),
      ).toBe(false);
      expect(isFieldTranslatable({ apiId: 'avatar', dataType: 'media' })).toBe(
        false,
      );
      expect(
        isFieldTranslatable({ apiId: 'author', dataType: 'relation' }),
      ).toBe(false);
    });
  });

  describe('Configuration persistence', () => {
    it('returns default config when storage is empty', () => {
      const config = getTranslationConfig();
      expect(config.provider).toBe('free');
      expect(config.model).toBe('gpt-4o-mini');
    });

    it('persists and loads updated config from localStorage', () => {
      const custom: TranslationConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key-123',
        model: 'gpt-4o',
      };
      saveTranslationConfig(custom);

      const loaded = getTranslationConfig();
      expect(loaded.provider).toBe('openai');
      expect(loaded.apiKey).toBe('sk-test-key-123');
      expect(loaded.model).toBe('gpt-4o');
    });
  });

  describe('translateText', () => {
    it('translates text using free MyMemory API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responseData: {
            translatedText: 'Hola Mundo',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await translateText({
        text: 'Hello World',
        sourceLocale: 'en',
        targetLocale: 'es',
        config: { provider: 'free' },
      });

      expect(result).toBe('Hola Mundo');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'api.mymemory.translated.net/get?q=Hello%20World&langpair=en|es',
        ),
      );
    });

    it('translates text using OpenAI API when configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Bonjour le monde',
              },
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await translateText({
        text: 'Hello world',
        sourceLocale: 'en',
        targetLocale: 'fr',
        config: {
          provider: 'openai',
          apiKey: 'sk-mock-key',
          model: 'gpt-4o-mini',
        },
      });

      expect(result).toBe('Bonjour le monde');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-mock-key',
          }),
        }),
      );
    });

    it('translates text using custom REST endpoint when configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          translatedText: 'Hallo Welt',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await translateText({
        text: 'Hello World',
        sourceLocale: 'en',
        targetLocale: 'de',
        config: {
          provider: 'custom',
          customEndpoint: 'https://internal-api.corp/translate',
        },
      });

      expect(result).toBe('Hallo Welt');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://internal-api.corp/translate',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('falls back to free API if OpenAI call fails', async () => {
      const mockFetch = vi
        .fn()
        // First call to OpenAI fails
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Invalid API Key',
        })
        // Second call falls back to MyMemory API
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseData: {
              translatedText: 'Hola Mundo Fallback',
            },
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const result = await translateText({
        text: 'Hello World',
        sourceLocale: 'en',
        targetLocale: 'es',
        config: {
          provider: 'openai',
          apiKey: 'invalid-key',
        },
      });

      expect(result).toBe('Hola Mundo Fallback');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('translateContentEntry', () => {
    it('translates all translatable string fields while preserving non-text fields', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('Technology')) {
          return {
            ok: true,
            json: async () => ({
              responseData: { translatedText: 'Tecnología' },
            }),
          };
        }
        if (url.includes('Latest%20AI%20updates')) {
          return {
            ok: true,
            json: async () => ({
              responseData: { translatedText: 'Últimas actualizaciones de IA' },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            responseData: { translatedText: 'Translated' },
          }),
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const fields = [
        {
          apiId: 'title',
          displayName: 'Title',
          dataType: 'text',
          isLocalized: true,
        },
        { apiId: 'summary', displayName: 'Summary', dataType: 'textarea' },
        { apiId: 'views', displayName: 'Views', dataType: 'number' },
        { apiId: 'isFeatured', displayName: 'Featured', dataType: 'boolean' },
      ];

      const sourceData = {
        title: 'Technology',
        summary: 'Latest AI updates',
        views: 1250,
        isFeatured: true,
      };

      const result = await translateContentEntry({
        fields,
        sourceData,
        sourceLocale: 'en',
        targetLocale: 'es',
        config: { provider: 'free' },
      });

      expect(result.success).toBe(true);
      expect(result.translatedCount).toBe(2);
      expect(result.translatedData).toEqual({
        title: 'Tecnología',
        summary: 'Últimas actualizaciones de IA',
        views: 1250, // Preserved as number
        isFeatured: true, // Preserved as boolean
      });
    });

    it('translates rich text Lexical JSON structure preserving nodes', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('Hello%20world')) {
          return {
            ok: true,
            json: async () => ({
              responseData: { translatedText: 'Hola mundo' },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            responseData: { translatedText: 'Translated' },
          }),
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const lexicalJson = JSON.stringify({
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Hello world',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      });

      const translated = await translateRichTextContent(
        lexicalJson,
        'en',
        'es',
        { provider: 'free' },
      );

      const parsed = JSON.parse(translated);
      expect(parsed.root.children[0].children[0].text).toBe('Hola mundo');
      expect(parsed.root.children[0].type).toBe('paragraph');
    });
  });

  describe('testTranslationProvider', () => {
    it('returns success when connection test succeeds', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responseData: {
            translatedText: 'Hola mundo',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await testTranslationProvider({ provider: 'free' });
      expect(res.success).toBe(true);
      expect(res.sample).toBe('Hola mundo');
    });
  });
});
