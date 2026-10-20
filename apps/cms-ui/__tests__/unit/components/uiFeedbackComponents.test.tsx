import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Files } from 'lucide-react';
import { InlineErrorAlert } from '../../../src/components/ui/InlineErrorAlert';
import { EmptyStateCard } from '../../../src/components/ui/EmptyStateCard';
import { DeletePageModal } from '../../../src/features/collections/components/modals/DeletePageModal';

describe('UI/UX Feedback Components', () => {
  describe('InlineErrorAlert', () => {
    it('renders error title, message, and executes retry action', () => {
      const handleRetry = vi.fn();
      render(
        <InlineErrorAlert
          title="Network Connection Failed"
          message="Server responded with 503 Service Unavailable"
          onRetry={handleRetry}
        />,
      );

      expect(screen.getByText('Network Connection Failed')).toBeInTheDocument();
      expect(
        screen.getByText('Server responded with 503 Service Unavailable'),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders back button and triggers onBack', () => {
      const handleBack = vi.fn();
      render(
        <InlineErrorAlert
          title="Not Found"
          message="Resource does not exist"
          onBack={handleBack}
          backText="Return to Dashboard"
        />,
      );

      const backBtn = screen.getByRole('button', {
        name: /return to dashboard/i,
      });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyStateCard', () => {
    it('renders title, description, tip, and action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyStateCard
          icon={Files}
          title="No Pages in Collection"
          description="Create your first page to start designing."
          actionLabel="Create Page"
          onAction={handleAction}
          tip="Supports dynamic slots and live preview"
        />,
      );

      expect(screen.getByText('No Pages in Collection')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first page to start designing.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Supports dynamic slots and live preview'),
      ).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: /create page/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('DeletePageModal Double-Confirmation', () => {
    const mockPage = {
      id: 'page-123',
      title: 'About Us Page',
      slug: 'about-us',
    };

    it('keeps delete button disabled until the exact page title is typed', () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <DeletePageModal
          page={mockPage}
          onClose={handleClose}
          onConfirm={handleConfirm}
          isPending={false}
          isError={false}
        />,
      );

      expect(screen.getByText('Delete Page Permanently')).toBeInTheDocument();
      const deleteBtn = screen.getByRole('button', { name: /delete page/i });
      expect(deleteBtn).toBeDisabled();

      const input = screen.getByPlaceholderText('Type page title here...');

      // Type wrong title
      fireEvent.change(input, { target: { value: 'Wrong Title' } });
      expect(deleteBtn).toBeDisabled();

      // Type exact matching title
      fireEvent.change(input, { target: { value: 'About Us Page' } });
      expect(deleteBtn).not.toBeDisabled();

      // Click delete
      fireEvent.click(deleteBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <DeletePageModal
          page={mockPage}
          onClose={handleClose}
          onConfirm={vi.fn()}
          isPending={false}
          isError={false}
        />,
      );

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
