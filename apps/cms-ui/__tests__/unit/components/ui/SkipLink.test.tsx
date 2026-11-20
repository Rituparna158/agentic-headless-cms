import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import {
  SkipLink,
  MAIN_CONTENT_ID,
} from '../../../../src/components/ui/SkipLink';

describe('SkipLink', () => {
  it('links to the main content landmark', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', `#${MAIN_CONTENT_ID}`);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <SkipLink />
        <main id={MAIN_CONTENT_ID}>content</main>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
