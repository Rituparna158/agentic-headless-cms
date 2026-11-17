import type { SlashCommand } from '../types/schemaRichText.types';

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    hint: 'Large section title',
    keywords: 'title h1 heading',
    run: (c) => c.setNode('heading', { level: 1 }),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    hint: 'Medium section title',
    keywords: 'subtitle h2 heading',
    run: (c) => c.setNode('heading', { level: 2 }),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    hint: 'Small section title',
    keywords: 'h3 heading',
    run: (c) => c.setNode('heading', { level: 3 }),
  },
  {
    id: 'bullets',
    label: 'Bulleted list',
    hint: 'A simple list of points',
    keywords: 'ul list bullets',
    run: (c) => c.toggleBulletList(),
  },
  {
    id: 'numbers',
    label: 'Numbered list',
    hint: 'A list with numbering',
    keywords: 'ol list numbers',
    run: (c) => c.toggleOrderedList(),
  },
  {
    id: 'quote',
    label: 'Quote',
    hint: 'Highlight a quotation',
    keywords: 'blockquote quote',
    run: (c) => c.toggleBlockquote(),
  },
  {
    id: 'code',
    label: 'Code block',
    hint: 'Show formatted code',
    keywords: 'code snippet pre',
    run: (c) => c.toggleCodeBlock(),
  },
  {
    id: 'divider',
    label: 'Divider',
    hint: 'A horizontal line between sections',
    keywords: 'hr divider line separator',
    run: (c) => c.setHorizontalRule(),
  },
  {
    id: 'image',
    label: 'Image',
    hint: 'Pick from the media library',
    keywords: 'image picture photo media',
    run: (c) => c,
  },
];

export const filterSlashCommands = (query: string): SlashCommand[] => {
  const q = query.toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (cmd) => cmd.label.toLowerCase().includes(q) || cmd.keywords.includes(q),
  );
};
