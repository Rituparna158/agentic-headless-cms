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
      {
        id: 'tpl-retail-boutique-store',
        title: 'Modern Retail & Fashion Boutique',
        category: 'retail',
        description: 'Editorial-grade luxury fashion and lifestyle storefront',
        isPublic: true,
        forkCount: 37,
        authorSite: 'Atelier & Co.',
        schema: {
          name: 'Boutique Products',
          slug: 'boutique-products',
          type: 'collection',
          fields: [],
        },
        slots: [],
      },
      {
        id: 'tpl-saas-software-platform',
        title: 'SaaS & Cloud Software Platform',
        category: 'saas',
        description: 'Modern software startup layout featuring tiered pricing',
        isPublic: true,
        forkCount: 56,
        authorSite: 'DevScale Systems',
        schema: {
          name: 'SaaS Features',
          slug: 'saas-features',
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

  it('displays dynamic Retail starter pages when a Retail boutique template is picked', async () => {
    renderModal();

    // Step 1: Basics
    const nameInput = screen.getByPlaceholderText(/Acme EU Hub/i);
    fireEvent.change(nameInput, { target: { value: 'Atelier Maison' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Pick ready-made template
    await screen.findByText('How would you like to start?');
    fireEvent.click(screen.getByText('Use a ready-made template'));

    const templateSelect = screen.getByLabelText('Template');
    fireEvent.change(templateSelect, {
      target: { value: 'tpl-retail-boutique-store' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 3: Articles (pages only)
    await screen.findByText('Does this website need a blog?');
    fireEvent.click(screen.getByText('No, pages only'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 4: Pages step
    await screen.findByText('Which starter pages should we set up for you?');

    // Distinct retail pages should now be shown
    expect(screen.getByText('Boutique Showcase Homepage')).toBeInTheDocument();
    expect(screen.getByText('Curated Collections & Drops')).toBeInTheDocument();
    expect(screen.getByText('Seasonal Lookbook & Catalog')).toBeInTheDocument();
    expect(
      screen.getByText('Store Locations & Styling Concierge'),
    ).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Boutique Home')).toBeInTheDocument();
    expect(screen.getByText('Lookbook')).toBeInTheDocument();
    expect(screen.getByText('Concierge')).toBeInTheDocument();
  });

  it('displays dynamic SaaS starter pages when a SaaS template is picked', async () => {
    renderModal();

    // Step 1: Basics
    const nameInput = screen.getByPlaceholderText(/Acme EU Hub/i);
    fireEvent.change(nameInput, { target: { value: 'Cloud Scale App' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Pick ready-made template
    await screen.findByText('How would you like to start?');
    fireEvent.click(screen.getByText('Use a ready-made template'));

    const templateSelect = screen.getByLabelText('Template');
    fireEvent.change(templateSelect, {
      target: { value: 'tpl-saas-software-platform' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 3: Articles (pages only)
    await screen.findByText('Does this website need a blog?');
    fireEvent.click(screen.getByText('No, pages only'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 4: Pages step
    await screen.findByText('Which starter pages should we set up for you?');

    // Distinct SaaS pages should now be shown
    expect(screen.getByText('Platform Landing')).toBeInTheDocument();
    expect(screen.getByText('Pricing & Plans Matrix')).toBeInTheDocument();
    expect(
      screen.getByText('Product Features & Integrations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Trust, Security & Compliance'),
    ).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Tech Landing')).toBeInTheDocument();
    expect(screen.getByText('Plans & Pricing')).toBeInTheDocument();
    expect(screen.getByText('Trust & Sec')).toBeInTheDocument();
  });

  it('allows filtering templates by category in the template selection step', async () => {
    renderModal();

    // Step 1: Basics
    const nameInput = screen.getByPlaceholderText(/Acme EU Hub/i);
    fireEvent.change(nameInput, { target: { value: 'Fashion Atelier' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Pick ready-made template
    await screen.findByText('How would you like to start?');
    fireEvent.click(screen.getByText('Use a ready-made template'));

    // Filter by Retail & Fashion
    const retailFilterBtn = screen.getByRole('button', {
      name: 'Retail & Fashion',
    });
    fireEvent.click(retailFilterBtn);

    // Should display retail template card
    expect(
      screen.getByText('Modern Retail & Fashion Boutique'),
    ).toBeInTheDocument();
    // And Amazon template should be filtered out from the cards list
    expect(
      screen.queryByText('Amazon-Style Product Detail & Gallery'),
    ).not.toBeInTheDocument();

    // Click All filter button
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(
      screen.getByText('Amazon-Style Product Detail & Gallery'),
    ).toBeInTheDocument();
  });
});
