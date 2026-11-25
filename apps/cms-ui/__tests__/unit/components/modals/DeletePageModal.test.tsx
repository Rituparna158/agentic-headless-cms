import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { DeletePageModal } from '@/components/modals/DeletePageModal';

describe('DeletePageModal', () => {
  const mockPage = {
    id: 'page-123',
    title: 'About Us',
  };

  it('renders modal with semantic form and confirms deletion when title matches', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    const { container } = render(
      <DeletePageModal
        page={mockPage}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isPending={false}
        isError={false}
      />,
    );

    expect(screen.getByText('Delete Page Permanently')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Type page title here...');
    const submitBtn = screen.getByRole('button', { name: /delete page/i });

    expect(submitBtn).toBeDisabled();

    // Type matching title
    fireEvent.change(input, { target: { value: 'About Us' } });
    expect(submitBtn).toBeEnabled();

    // Submit form
    fireEvent.click(submitBtn);
    expect(handleConfirm).toHaveBeenCalled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders nothing when page is null', () => {
    const { container } = render(
      <DeletePageModal
        page={null}
        onClose={() => {}}
        onConfirm={() => {}}
        isPending={false}
        isError={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
