import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageEditorPage } from '../../../../src/features/pages/pages/editors/PageEditorPage';
import { BrowserRouter } from 'react-router-dom';
import * as ReactQuery from '@tanstack/react-query';
import { usePageBuilderStore } from '../../../../src/features/pages/components/page-builder/stores/pageBuilderStore';

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

// Mock react-router-dom useParams
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'page-1' }),
  };
});

// Mock PageBuilderReact component
vi.mock('@mindfiredigital/page-builder-react', () => ({
  PageBuilderReact: ({
    initialDesign,
    brandTitle,
  }: {
    initialDesign: unknown;
    brandTitle: string;
  }) => (
    <div data-testid="page-builder-mock">
      <div data-testid="pb-initial-design">{JSON.stringify(initialDesign)}</div>
      <div data-testid="pb-brand-title">{brandTitle}</div>
    </div>
  ),
}));

// Mock custom hook
vi.mock('../../../../src/features/pages/hooks/usePageSchema', () => ({
  usePageSchema: () => ({ data: { id: 'schema-1' }, isLoading: false }),
}));

// Mock GrapesJSEditor
vi.mock('../../../../src/features/pages/pages/editors/GrapesJSEditor', () => ({
  GrapesJSEditor: ({
    initialData,
    brandTitle,
  }: {
    initialData: unknown;
    brandTitle: string;
  }) => (
    <div data-testid="grapesjs-editor-mock">
      <div data-testid="gjs-initial-data">{JSON.stringify(initialData)}</div>
      <div data-testid="gjs-brand-title">{brandTitle}</div>
    </div>
  ),
}));

describe('PageEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePageBuilderStore.getState().resetStore();

    // Create stable reference to prevent infinite render loop in useEffect
    const mockPageData = {
      data: {
        data: {
          title: 'Test Title',
          slug: '/test',
          body: [{ id: '1', type: 'text' }],
        },
      },
      isLoading: false,
    };

    // Mock the page query only
    (ReactQuery.useQuery as Mock).mockReturnValue(mockPageData);

    (ReactQuery.useMutation as Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <ReactQuery.QueryClientProvider client={new ReactQuery.QueryClient()}>
          <PageEditorPage />
        </ReactQuery.QueryClientProvider>
      </BrowserRouter>,
    );
  };

  it('should auto-generate slug from title if not manually edited', async () => {
    renderComponent();

    const titleInput = await screen.findByPlaceholderText('Page Title');
    const slugInput = await screen.findByPlaceholderText('/page-slug');

    fireEvent.change(titleInput, { target: { value: 'New Amazing Title' } });

    expect((slugInput as HTMLInputElement).value).toBe('/new-amazing-title');
  });

  it('should disable Save button if title is empty', async () => {
    renderComponent();

    const titleInput = await screen.findByPlaceholderText('Page Title');
    fireEvent.change(titleInput, { target: { value: '   ' } }); // empty spaces

    const saveButton = screen.getByText('Save').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('should handle undefined/null body from API safely', async () => {
    const emptyMockData = {
      data: {
        data: { title: 'Empty Page', slug: '/empty', body: null }, // Null body
      },
      isLoading: false,
    };
    (ReactQuery.useQuery as Mock).mockReturnValue(emptyMockData);

    renderComponent();

    // Should render GrapesJS builder as fallback with default structure safely without crashing
    const gjsInitialData = await screen.findByTestId('gjs-initial-data');
    expect(gjsInitialData).toHaveTextContent('"builder":"grapesjs"');
  });
});
