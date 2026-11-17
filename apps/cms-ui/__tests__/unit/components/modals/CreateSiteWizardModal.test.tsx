import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CreateSiteWizardModal } from '@/features/collections/components/modals/CreateSiteWizardModal';
import { collectionsApi } from '@/features/collections/api/collections.api';
import { postsApi } from '@/features/posts/api/posts.api';

vi.mock('@/features/collections/api/collections.api', () => ({
  collectionsApi: {
    createSchema: vi.fn(),
    updateSchema: vi.fn(),
    createPage: vi.fn(),
  },
}));

vi.mock('@/features/posts/api/posts.api', () => ({
  postsApi: {
    listCollections: vi.fn(),
    getSharedTemplates: vi.fn(),
    forkTemplate: vi.fn(),
    forkSchema: vi.fn(),
  },
  extractArrayPayload: vi.fn((data) => (Array.isArray(data) ? data : [])),
}));

vi.mock('@/features/blog/api/blog.api', () => ({
  blogApi: {
    createBlogType: vi.fn(),
  },
}));

vi.mock('@/hooks/useCmsToast', () => ({
  useCmsToast: () => ({
    show: vi.fn(),
  }),
}));

describe('CreateSiteWizardModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(postsApi.listCollections).mockResolvedValue([] as any);
    vi.mocked(postsApi.getSharedTemplates).mockReturnValue([
      {
        id: 'tpl-amazon-product-showcase',
        title: 'Amazon-Style Product Detail & Gallery',
        category: 'ecommerce',
        description: 'High-converting product showcase layout',
        isPublic: true,
        forkCount: 42,
        authorSite: 'Global Retail Hub',
        schema: {
          name: 'Products',
          slug: 'products',
          type: 'collection',
          fields: [],
        },
        slots: [],
      },
    ] as any);

    vi.mocked(collectionsApi.createSchema).mockResolvedValue({
      id: 'schema-123',
      name: 'Test Store',
      slug: 'test-store',
      metadata: {},
    } as any);

    vi.mocked(collectionsApi.updateSchema).mockResolvedValue({} as any);
    vi.mocked(collectionsApi.createPage).mockResolvedValue({} as any);
  });

  const renderModal = (props?: { isOpen?: boolean; onClose?: () => void }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreateSiteWizardModal
            isOpen={props?.isOpen ?? true}
            onClose={props?.onClose ?? vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('displays default General starter pages in the pages step and creates them with visual body and schemas', async () => {
    renderModal();

    // Step 1: Basics
    const nameInput = screen.getByPlaceholderText(/Acme EU Hub/i);
    fireEvent.change(nameInput, { target: { value: 'Acme Corporation' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Start mode (blank / start fresh)
    await screen.findByText('How would you like to start?');
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 3: Articles (pages only to skip blog step)
    await screen.findByText('Does this website need a blog?');
    fireEvent.click(screen.getByText('No, pages only'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 4: Pages step
    await screen.findByText('Which starter pages should we set up for you?');

    // Should display general starter pages
    expect(screen.getByText('Homepage')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Services & Solutions')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Core Landing')).toBeInTheDocument();
    expect(screen.getByText('Company Story')).toBeInTheDocument();

    // Proceed to review
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 5: Review
    await screen.findByText('Ready to launch?');
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();

    // Click Create website
    const createBtn = screen.getByRole('button', { name: /Create website/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(collectionsApi.createSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Corporation',
          slug: 'acme-corporation',
        }),
      );
    });

    // Verify createPage was called with visual body layout and schemas
    await waitFor(() => {
      expect(collectionsApi.createPage).toHaveBeenCalled();
    });

    const createPageCalls = vi.mocked(collectionsApi.createPage).mock.calls;
    expect(createPageCalls.length).toBeGreaterThanOrEqual(3);

    // Verify Homepage call arguments
    const homeCall = createPageCalls.find((call) => call[1].slug === '/');
    expect(homeCall).toBeDefined();
    expect(homeCall![1].title).toBe('Homepage');
    expect(homeCall![1].body).toBeDefined();
    expect((homeCall![1].body as any).builder).toBe('grapesjs');
    expect(typeof (homeCall![1].body as any).html).toBe('string');
    expect(Array.isArray(homeCall![1]._schemas)).toBe(true);
    expect((homeCall![1]._schemas as any[]).length).toBe(2);
    expect((homeCall![1]._schemas as any[])[0].id).toBe('hero-section');
  });

  it('displays dynamic Ecommerce starter pages when an Ecommerce template is picked', async () => {
    renderModal();

    // Step 1: Basics
    const nameInput = screen.getByPlaceholderText(/Acme EU Hub/i);
    fireEvent.change(nameInput, { target: { value: 'Amazon Tech Store' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Pick ready-made template
    await screen.findByText('How would you like to start?');
    fireEvent.click(screen.getByText('Use a ready-made template'));

    const templateSelect = screen.getByLabelText('Template');
    fireEvent.change(templateSelect, {
      target: { value: 'tpl-amazon-product-showcase' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 3: Articles (pages only)
    await screen.findByText('Does this website need a blog?');
    fireEvent.click(screen.getByText('No, pages only'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 4: Pages step
    await screen.findByText('Which starter pages should we set up for you?');

    // Dynamic ecommerce pages should now be shown
    expect(screen.getByText('Storefront Homepage')).toBeInTheDocument();
    expect(screen.getByText('Product Catalog & Shop')).toBeInTheDocument();
    expect(screen.getByText('Shipping & Orders')).toBeInTheDocument();
    expect(screen.getByText('Support & Returns')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Storefront Home')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
  });
});
