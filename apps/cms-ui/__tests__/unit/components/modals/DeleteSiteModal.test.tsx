import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeleteSiteModal } from '../../../../src/components/modals/DeleteSiteModal';

describe('DeleteSiteModal', () => {
  const dummyEmptySite = {
    id: 'site-1',
    name: 'My Personal Site',
    slug: 'my-personal-site',
    entryCount: 0,
  };

  const dummyPopulatedSite = {
    id: 'site-2',
    name: 'Production Blog',
    slug: 'production-blog',
    entryCount: 15,
  };

  it('renders nothing when site is null', () => {
    const { container } = render(
      <DeleteSiteModal
        site={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders site details and disables delete button initially', () => {
    render(
      <DeleteSiteModal
        site={dummyEmptySite}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('Delete Website Property')).toBeInTheDocument();
    expect(screen.getByText('"My Personal Site"')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('my-personal-site')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', {
      name: /Permanently Delete Website/i,
    });
    expect(deleteBtn).toBeDisabled();
  });

  it('enables delete button when slug is typed for empty site', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteSiteModal
        site={dummyEmptySite}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    const input = screen.getByPlaceholderText('my-personal-site');
    fireEvent.change(input, { target: { value: 'my-personal-site' } });

    const deleteBtn = screen.getByRole('button', {
      name: /Permanently Delete Website/i,
    });
    expect(deleteBtn).toBeEnabled();

    fireEvent.click(deleteBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('requires force delete checkbox when site contains active content', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteSiteModal
        site={dummyPopulatedSite}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    expect(
      screen.getByText('Website Contains Active Content'),
    ).toBeInTheDocument();
    expect(screen.getByText('15 items')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('production-blog');
    const deleteBtn = screen.getByRole('button', {
      name: /Permanently Delete Website/i,
    });

    // 1. Type slug only -> should still be disabled
    fireEvent.change(input, { target: { value: 'production-blog' } });
    expect(deleteBtn).toBeDisabled();

    // 2. Check force delete checkbox -> now should be enabled
    const forceCheckbox = screen.getByRole('checkbox');
    fireEvent.click(forceCheckbox);
    expect(deleteBtn).toBeEnabled();

    // 3. Click delete -> should call with force = true
    fireEvent.click(deleteBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('renders loading state when isPending is true', () => {
    render(
      <DeleteSiteModal
        site={dummyEmptySite}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
      />,
    );

    expect(screen.getByText('Deleting Website...')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Deleting Website\.\.\./i }),
    ).toBeDisabled();
  });

  it('displays error message when isError is true', () => {
    render(
      <DeleteSiteModal
        site={dummyEmptySite}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
        isError={true}
        errorMessage="Database connection timed out"
      />,
    );

    expect(
      screen.getByText('Database connection timed out'),
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <DeleteSiteModal
        site={dummyEmptySite}
        onClose={onClose}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
