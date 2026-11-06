/**
 * Translation service supporting zero-config public translation (MyMemory),
 * OpenAI API translation (configurable), and custom REST endpoints.
 * Includes native support for Lexical Rich Text AST preservation.
 */

export type TranslationProviderType = 'free' | 'openai' | 'custom';

export interface TranslationConfig {
  provider: TranslationProviderType;
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
}

export interface TranslateTextParams {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  config?: TranslationConfig;
}

export interface FieldDefinitionLike {
  apiId: string;
  displayName?: string;
  dataType: string;
  isLocalized?: boolean;
}

export interface TranslateEntryParams {
  fields: FieldDefinitionLike[];
  sourceData: Record<string, unknown>;
  sourceLocale: string;
  targetLocale: string;
  config?: TranslationConfig;
}

export interface TranslationResult {
  success: boolean;
  translatedData: Record<string, unknown>;
  translatedCount: number;
  provider: TranslationProviderType;
  errors?: string[];
}

const STORAGE_KEY = 'agentic_cms_translation_config';

export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  provider: 'free',
  model: 'gpt-4o-mini',
};

/**
 * Retrieves the stored translation configuration from localStorage or falls back
 * to environment variables or the zero-config 'free' default.
 */
export function getTranslationConfig(): TranslationConfig {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TranslationConfig>;
        return {
          provider: parsed.provider || 'free',
          apiKey: parsed.apiKey || '',
          model: parsed.model || 'gpt-4o-mini',
          customEndpoint: parsed.customEndpoint || '',
        };
      }
    } catch {
      // Fallback on storage errors
    }
  }

  // Fallback to Next.js public environment variables if present
  const envProvider = process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER as
    | TranslationProviderType
    | undefined;
  const envApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const envEndpoint = process.env.NEXT_PUBLIC_TRANSLATION_ENDPOINT;

  if (envProvider && ['free', 'openai', 'custom'].includes(envProvider)) {
    return {
      provider: envProvider,
      apiKey: envApiKey || '',
      model: 'gpt-4o-mini',
      customEndpoint: envEndpoint || '',
    };
  }

  if (envApiKey) {
    return {
      provider: 'openai',
      apiKey: envApiKey,
      model: 'gpt-4o-mini',
    };
  }

  return { ...DEFAULT_TRANSLATION_CONFIG };
}

/**
 * Persists the translation configuration to localStorage.
 */
export function saveTranslationConfig(config: TranslationConfig): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('Failed to save translation config to localStorage:', err);
    }
  }
}

/**
 * Normalizes locale codes to 2-letter ISO standard (e.g. "en-US" -> "en")
 * for APIs requiring 2-letter codes.
 */
export function normalizeLocaleCode(code: string): string {
  if (!code) return 'en';
  const clean = code.trim().toLowerCase();
  const [lang] = clean.split(/[-_]/);
  return lang || clean;
}

/**
 * Decodes standard HTML entities returned by translation APIs (e.g. &#39; -> ').
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Translates a single text string using the free public MyMemory API.
 */
async function translateWithFreeApi(
  text: string,
  sourceLocale: string,
  targetLocale: string,
): Promise<string> {
  const src = normalizeLocaleCode(sourceLocale);
  const tgt = normalizeLocaleCode(targetLocale);

  if (src === tgt || !text.trim()) {
    return text;
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Free translation service responded with status ${response.status}`,
    );
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText;

  if (typeof translated === 'string' && translated.trim().length > 0) {
    return decodeHtmlEntities(translated);
  }

  return text;
}

/**
 * Translates text using the OpenAI Chat Completions API.
 */
async function translateWithOpenAI(
  text: string,
  sourceLocale: string,
  targetLocale: string,
  config: TranslationConfig,
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error('OpenAI API Key is required for OpenAI translation.');
  }

  const model = config.model || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are an expert translator for a Headless CMS. Translate the given text from ${sourceLocale} to ${targetLocale}. Preserve all HTML, Markdown, punctuation, and structural tags verbatim. Return ONLY the translated text without commentary, quotes, or markdown code fences.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI translation failed with status ${response.status}: ${errorBody}`,
    );
  }

  const json = await response.json();
  const output = json?.choices?.[0]?.message?.content;
  if (typeof output === 'string') {
    return output.trim();
  }

  return text;
}

/**
 * Translates text using a custom REST endpoint.
 */
async function translateWithCustomEndpoint(
  text: string,
  sourceLocale: string,
  targetLocale: string,
  config: TranslationConfig,
): Promise<string> {
  const endpoint = config.customEndpoint?.trim();
  if (!endpoint) {
    throw new Error('Custom endpoint URL is required for custom translation.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      text,
      sourceLocale,
      targetLocale,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Custom translation endpoint responded with status ${response.status}`,
    );
  }

  const json = await response.json();
  const output =
    json?.translatedText ?? json?.data?.translatedText ?? json?.result;

  if (typeof output === 'string') {
    return output.trim();
  }

  return text;
}

/**
 * Translates a single text string based on active or provided configuration.
 */
export async function translateText({
  text,
  sourceLocale,
  targetLocale,
  config: providedConfig,
}: TranslateTextParams): Promise<string> {
  if (!text || !text.trim()) return text;
  const config = providedConfig || getTranslationConfig();

  try {
    if (config.provider === 'openai') {
      return await translateWithOpenAI(
        text,
        sourceLocale,
        targetLocale,
        config,
      );
    }
    if (config.provider === 'custom') {
      return await translateWithCustomEndpoint(
        text,
        sourceLocale,
        targetLocale,
        config,
      );
    }
    return await translateWithFreeApi(text, sourceLocale, targetLocale);
  } catch (primaryError) {
    // If OpenAI or custom endpoint fails, fallback to free translation to avoid blocking the user
    if (config.provider !== 'free') {
      console.warn(
        `Translation provider "${config.provider}" failed, falling back to free provider:`,
        primaryError,
      );
      try {
        return await translateWithFreeApi(text, sourceLocale, targetLocale);
      } catch (fallbackError) {
        console.error('All translation providers failed:', fallbackError);
        throw primaryError;
      }
    }
    throw primaryError;
  }
}

/**
 * Checks whether a given schema field is eligible for automated text translation.
 */
export function isFieldTranslatable(field: FieldDefinitionLike): boolean {
  // If explicitly flagged as localized, it is eligible
  if (field.isLocalized) return true;

  // By default, text-like fields are eligible
  const textTypes = ['text', 'textarea', 'richtext'];
  return textTypes.includes(field.dataType);
}

/**
 * Recursively walks a Lexical AST node tree, translating text node values
 * while preserving paragraph, heading, list, link, and formatting nodes.
 */
async function translateLexicalNode(
  node: unknown,
  sourceLocale: string,
  targetLocale: string,
  config: TranslationConfig,
): Promise<unknown> {
  if (!node || typeof node !== 'object') return node;

  const nodeObj = node as Record<string, unknown>;
  const cloned: Record<string, unknown> = { ...nodeObj };

  if (
    cloned.type === 'text' &&
    typeof cloned.text === 'string' &&
    cloned.text.trim().length > 0
  ) {
    try {
      cloned.text = await translateText({
        text: cloned.text,
        sourceLocale,
        targetLocale,
        config,
      });
    } catch (err) {
      console.warn('Failed to translate Lexical text node:', err);
    }
  }

  if (Array.isArray(cloned.children)) {
    cloned.children = await Promise.all(
      cloned.children.map((child) =>
        translateLexicalNode(child, sourceLocale, targetLocale, config),
      ),
    );
  }

  return cloned;
}

/**
 * Translates rich text content. If the content is a serialized Lexical JSON string
 * or object, it parses the AST, translates each individual text node in place,
 * and re-serializes the JSON so rich text formatting is preserved.
 */
export async function translateRichTextContent(
  raw: unknown,
  sourceLocale: string,
  targetLocale: string,
  config: TranslationConfig,
): Promise<string> {
  if (!raw) return '';

  if (typeof raw === 'object' && raw !== null && 'root' in raw) {
    try {
      const translatedRoot = await translateLexicalNode(
        (raw as { root: unknown }).root,
        sourceLocale,
        targetLocale,
        config,
      );
      return JSON.stringify({
        ...(raw as Record<string, unknown>),
        root: translatedRoot,
      });
    } catch {
      return JSON.stringify(raw);
    }
  }

  if (typeof raw === 'string') {
    if (raw.startsWith('{"root":') || raw.includes('"root":{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.root) {
          const translatedRoot = await translateLexicalNode(
            parsed.root,
            sourceLocale,
            targetLocale,
            config,
          );
          return JSON.stringify({ ...parsed, root: translatedRoot });
        }
      } catch {
        // Fall back to plain text translation if JSON parsing fails
      }
    }
    return await translateText({
      text: raw,
      sourceLocale,
      targetLocale,
      config,
    });
  }

  return String(raw);
}

/**
 * Auto-translates all translatable localized fields for a content entry.
 * Non-translatable fields (numbers, booleans, dates, media, relations) are preserved.
 */
export async function translateContentEntry({
  fields,
  sourceData,
  sourceLocale,
  targetLocale,
  config: providedConfig,
}: TranslateEntryParams): Promise<TranslationResult> {
  const config = providedConfig || getTranslationConfig();
  const translatedData: Record<string, unknown> = { ...sourceData };
  const errors: string[] = [];
  let translatedCount = 0;

  for (const field of fields) {
    const rawValue = sourceData[field.apiId];

    if (
      !isFieldTranslatable(field) ||
      rawValue === undefined ||
      rawValue === null
    ) {
      continue;
    }

    // Rich Text fields (Lexical AST or JSON)
    if (
      field.dataType === 'richtext' ||
      (typeof rawValue === 'string' && rawValue.startsWith('{"root":')) ||
      (typeof rawValue === 'object' && rawValue !== null && 'root' in rawValue)
    ) {
      try {
        const translated = await translateRichTextContent(
          rawValue,
          sourceLocale,
          targetLocale,
          config,
        );
        translatedData[field.apiId] = translated;
        translatedCount++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Field "${field.displayName || field.apiId}": ${errMsg}`);
        translatedData[field.apiId] =
          typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;
      }
      continue;
    }

    // Standard string text fields (text, textarea)
    if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
      try {
        const translated = await translateText({
          text: rawValue,
          sourceLocale,
          targetLocale,
          config,
        });
        translatedData[field.apiId] = translated;
        translatedCount++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Field "${field.displayName || field.apiId}": ${errMsg}`);
        translatedData[field.apiId] = rawValue;
      }
    }
  }

  return {
    success: errors.length === 0,
    translatedData,
    translatedCount,
    provider: config.provider,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Quick connection test to verify that the configured provider works.
 */
export async function testTranslationProvider(
  config: TranslationConfig,
): Promise<{ success: boolean; message: string; sample?: string }> {
  try {
    const sample = await translateText({
      text: 'Hello world',
      sourceLocale: 'en',
      targetLocale: 'es',
      config,
    });

    return {
      success: true,
      message: `Successfully connected to ${config.provider} provider.`,
      sample,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Translation test failed.',
    };
  }
}
