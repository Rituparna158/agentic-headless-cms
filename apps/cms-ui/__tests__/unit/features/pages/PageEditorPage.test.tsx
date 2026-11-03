import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageEditorPage } from '../../../../src/features/collections/pages/editors/PageEditorPage';
import { BrowserRouter } from 'react-router-dom';
import * as ReactQuery from '@tanstack/react-query';
import { usePageBuilderStore } from '../../../../src/features/collections/components/page-builder/stores/pageBuilderStore';

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
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

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

// Mock GrapesJSEditor
vi.mock(
  '../../../../src/features/collections/pages/editors/GrapesJSEditor',
  () => ({
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
  }),
);

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

  it('should open Schemas drawer without crashing when clicking Schemas button', async () => {
    const mockPageData = {
      data: {
        id: 'page-1',
        data: {
          title: 'Blog Overview',
          slug: '/blog-overview',
          body: { builder: 'grapesjs' },
          _schemas: [
            {
              id: 's1',
              name: 'Hero Schema',
              slug: 'hero_schema',
              fields: [
                { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
              ],
            },
          ],
        },
      },
      isLoading: false,
    };
    (ReactQuery.useQuery as Mock).mockReturnValue(mockPageData);

    renderComponent();

    const schemasButton = await screen.findByRole('button', {
      name: /manage custom schemas/i,
    });
    expect(schemasButton).toBeInTheDocument();

    fireEvent.click(schemasButton);

    // Verify drawer is open and rendered without blanking out
    const drawerDialog = await screen.findByRole('dialog');
    expect(drawerDialog).toBeInTheDocument();
    expect(screen.getByText('Hero Schema')).toBeInTheDocument();
    expect(screen.getByText('Page Schemas')).toBeInTheDocument();
  });

  it('should open Schemas drawer with empty state when page has no schemas and transition to builder', async () => {
    const mockEmptyPageData = {
      data: {
        id: 'page-1',
        title: 'Empty Page',
        slug: '/empty-page',
        data: {
          title: 'Empty Page',
          slug: '/empty-page',
          body: { builder: 'grapesjs' },
          _schemas: [],
        },
      },
      isLoading: false,
    };
    (ReactQuery.useQuery as Mock).mockReturnValue(mockEmptyPageData);

    renderComponent();

    const schemasButton = await screen.findByRole('button', {
      name: /manage custom schemas/i,
    });
    fireEvent.click(schemasButton);

    const drawerDialog = await screen.findByRole('dialog');
    expect(drawerDialog).toBeInTheDocument();

    // Verify empty state message
    expect(
      screen.getByText(/No custom schemas defined on this page yet/i),
    ).toBeInTheDocument();

    // Click "Create Schema" to transition to builder
    const createButtons = screen.getAllByRole('button', {
      name: /Create Schema/i,
    });
    expect(createButtons.length).toBeGreaterThan(0);
    fireEvent.click(createButtons[0] as HTMLElement);

    // Builder should render without blanking out
    expect(screen.getByText('Create New Schema')).toBeInTheDocument();
  });
});
