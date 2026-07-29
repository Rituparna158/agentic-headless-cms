import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LexicalRichTextField } from '@/components/content-editor/lexical-rich-text-field';

/* Typing/formatting interactions aren't covered here: jsdom's contentEditable
has no real Selection/Range or beforeinput support, so Lexical never
actually inserts text under userEvent - assertions on the result would be
 a false positive. That real-typing path is covered by an E2E spec
(rich-text-content.spec.ts) instead, in a real browser.*/

const SERIALIZED_HELLO_WORLD = JSON.stringify({
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

describe('LexicalRichTextField', () => {
  it('renders the placeholder and formatting toolbar when empty', () => {
    render(
      <LexicalRichTextField value="" onChange={vi.fn()} placeholder="Body" />,
    );

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Underline' }),
    ).toBeInTheDocument();
  });

  it('hydrates from a serialized editor state so existing content is shown on load', () => {
    render(
      <LexicalRichTextField
        value={SERIALIZED_HELLO_WORLD}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('disables the content area and toolbar buttons when disabled', () => {
    render(<LexicalRichTextField value="" onChange={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'contenteditable',
      'false',
    );
  });
});
