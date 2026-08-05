import pluralize from 'pluralize';

// Format as PascalCase
export function toPascalCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
}

// Format as camelCase
export function toCamelCase(slug: string): string {
  const pascal = toPascalCase(slug);
  return pascal[0]!.toLowerCase() + pascal.slice(1);
}

// Format as plural camelCase
export function toPluralCamelCase(slug: string): string {
  return pluralize(toCamelCase(slug));
}
