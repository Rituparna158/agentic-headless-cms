import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/confirm-dialog';

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Delete this?"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText('Delete this?')).not.toBeInTheDocument();
  });

  it('shows the title and description when open', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete this file?"
        description="This can't be undone."
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete this?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancelled', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete this?"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
