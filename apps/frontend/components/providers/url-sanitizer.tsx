'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function UrlSanitizer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sensitiveKeys = [
      'email',
      'password',
      'newPassword',
      'confirmPassword',
      'code',
    ];
    let hasSensitive = false;
    const newParams = new URLSearchParams(searchParams.toString());

    for (const key of sensitiveKeys) {
      if (newParams.has(key)) {
        newParams.delete(key);
        hasSensitive = true;
      }
    }

    if (hasSensitive) {
      const queryString = newParams.toString();
      const newUrl = pathname + (queryString ? `?${queryString}` : '');
      // Update the URL bar immediately without pushing history state or reloading
      window.history.replaceState(null, '', newUrl);
    }
  }, [pathname, searchParams]);

  return null;
}
