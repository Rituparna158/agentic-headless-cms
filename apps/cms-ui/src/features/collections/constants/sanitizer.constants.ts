export const FORBIDDEN_HTML_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
]);

export const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/javascript',
];
