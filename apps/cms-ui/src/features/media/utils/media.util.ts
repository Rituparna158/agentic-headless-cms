import { env } from '@/config/env';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot + 1).toUpperCase();
}

export function getMimeCategory(
  mimeType: string,
): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('text')
  ) {
    return 'document';
  }
  return 'other';
}

export function getMediaFileUrl(urlOrPath: string | undefined | null): string {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  if (urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:')) {
    return urlOrPath;
  }

  const cleanPath = urlOrPath.startsWith('/')
    ? urlOrPath
    : `/api/v1/media/file/${urlOrPath}`;

  // If in browser development and API is at a different origin:
  if (typeof window !== 'undefined' && env.VITE_API_URL.startsWith('http')) {
    try {
      const apiOrigin = new URL(env.VITE_API_URL).origin;
      return `${apiOrigin}${cleanPath}`;
    } catch {
      return cleanPath;
    }
  }

  return cleanPath;
}
