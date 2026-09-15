import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PagesListPage } from '../../../../src/features/pages/pages/PagesListPage';
import { BrowserRouter } from 'react-router-dom';
import * as ReactQuery from '@tanstack/react-query';
import * as SharedUi from '@repo/shared-ui';

// Mock dependencies
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@repo/shared-ui', () => ({
  useToast: vi.fn(),
  DialogContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock API
vi.mock('../../../../src/features/pages/api/pages.api', () => ({
  pagesApi: {
    deletePage: vi.fn(),
  },
}));

describe('PagesListPage', () => {
  const mockErrorToast = vi.fn();
  const mockSuccessToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (SharedUi.useToast as Mock).mockReturnValue({
      error: mockErrorToast,
      success: mockSuccessToast,
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <ReactQuery.QueryClientProvider client={new ReactQuery.QueryClient()}>
          <PagesListPage />
        </ReactQuery.QueryClientProvider>
      </BrowserRouter>,
    );
  };

  it('should render an empty state when no pages exist', () => {
    (ReactQuery.useQuery as Mock).mockReturnValue({
      data: { data: [], meta: { pagination: { total: 0 } } },
      isLoading: false,
    });

    renderComponent();
    expect(screen.getByText('No pages yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first page to get started'),
    ).toBeInTheDocument();
  });

  it('should handle deletion success and show destructive error toast', async () => {
    (ReactQuery.useQuery as Mock).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            data: { title: 'Test Page', slug: '/test' },
            updatedAt: new Date().toISOString(),
          },
        ],
        meta: { pagination: { total: 1 } },
      },
      isLoading: false,
    });

    // Mock mutation to immediately call onSuccess
    (ReactQuery.useMutation as Mock).mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => ({
        mutate: () => onSuccess(),
        isPending: false,
      }),
    );

    renderComponent();

    // Find delete button
    const deleteButton = screen.getByTitle('Delete Page');
    fireEvent.click(deleteButton);

    // Dialog should open - wait for it
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument(); // Modal renders
    });

    // Confirm deletion - the actual button text is "Delete Page" inside the modal
    const confirmButtons = screen.getAllByText('Delete Page');
    // The second one is the button in the modal (first is table title/button maybe? actually it's likely just one if title matches title attr)
    const modalConfirm = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirm!);

    // Verify destructive toast is called
    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('Page deleted successfully');
      expect(mockSuccessToast).not.toHaveBeenCalled(); // Ensure it doesn't use success toast
    });
  });
});
