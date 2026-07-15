import pluralize from 'pluralize';

/** 'blog-post' -> 'BlogPost' — GraphQL type names can't contain hyphens. */
export function toPascalCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
}

/** 'blog-post' -> 'blogPost' — single-entry query/mutation field name. */
export function toCamelCase(slug: string): string {
  const pascal = toPascalCase(slug);
  return pascal[0]!.toLowerCase() + pascal.slice(1);
}

/** 'blog-post' -> 'blogPosts', 'category' -> 'categories' — list query field name. */
export function toPluralCamelCase(slug: string): string {
  return pluralize(toCamelCase(slug));
}
