import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnapshotDetailDeck } from '../../../../src/features/collections/components/template/SnapshotDetailDeck';
import type { ContentVersionRecord } from '../../../../src/features/collections/types/template.types';
import type { PageCustomSchema } from '../../../../src/types/content.types';

describe('SnapshotDetailDeck Component & Diff Engine', () => {
  const baseMockSnapshot: ContentVersionRecord = {
    id: 'ver-2',
    entryId: 'page-1',
    locale: 'en',
    actorType: 'user',
    versionNo: 2,
    comment: 'Updated product pricing and hero schema',
    createdAt: '2026-10-26T10:00:00.000Z',
    createdByUserId: 'user-456',
    createdByUserName: 'Sarah Developer',
    data: {
      title: 'Our Products Page (v2)',
      slug: 'our-products',
      body: { components: [1, 2, 3] },
      description: 'Updated product catalog',
      _schemas: [
        {
          id: 'schema-hero',
          name: 'Hero Banner',
          slug: 'hero-banner',
          entryType: 'single',
          fields: [
            { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
            {
              apiId: 'subheading',
              displayName: 'Subheading',
              dataType: 'text',
            },
          ],
          values: {
            heading: 'Discover Awesome Products',
            subheading: 'Winter 2026 Edition',
          },
        } as unknown as PageCustomSchema,
        {
          id: 'schema-products',
          name: 'Featured Products',
          slug: 'featured-products',
          entryType: 'multi',
          fields: [
            { apiId: 'name', displayName: 'Product Name', dataType: 'text' },
            { apiId: 'price', displayName: 'Price', dataType: 'number' },
          ],
          values: {},
          items: [
            { name: 'Warm Jacket', price: 99 },
            { name: 'Wool Beanie', price: 29 },
          ],
        } as unknown as PageCustomSchema,
      ],
    },
  };

  const previousSnapshot: ContentVersionRecord = {
    id: 'ver-1',
    entryId: 'page-1',
    locale: 'en',
    actorType: 'user',
    versionNo: 1,
    comment: 'Initial page creation',
    createdAt: '2026-10-26T08:00:00.000Z',
    createdByUserId: 'admin-1',
    createdByUserName: null,
    data: {
      title: 'Our Products Page',
      slug: 'products',
      body: { components: [1] },
      description: 'Original catalog',
      _schemas: [
        {
          id: 'schema-hero',
          name: 'Hero Banner',
          slug: 'hero-banner',
          entryType: 'single',
          fields: [
            { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
          ],
          values: {
            heading: 'Welcome to Our Store',
          },
        } as unknown as PageCustomSchema,
        {
          id: 'schema-products',
          name: 'Featured Products',
          slug: 'featured-products',
          entryType: 'multi',
          fields: [
            { apiId: 'name', displayName: 'Product Name', dataType: 'text' },
            { apiId: 'price', displayName: 'Price', dataType: 'number' },
          ],
          values: {},
          items: [{ name: 'Warm Jacket', price: 89 }],
        } as unknown as PageCustomSchema,
      ],
    },
  };

  const currentPageData = {
    title: 'Live Live Live Page',
    slug: 'live-products',
    body: { components: [1, 2, 3, 4] },
    description: 'Current live draft',
    _schemas: [
      {
        id: 'schema-hero',
        name: 'Hero Banner',
        slug: 'hero-banner',
        entryType: 'single',
        fields: [
          { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
          { apiId: 'subheading', displayName: 'Subheading', dataType: 'text' },
        ],
        values: {
          heading: 'Live Header Text',
          subheading: 'Winter 2026 Edition',
        },
      } as PageCustomSchema,
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SnapshotDetailDeck
        isOpen={false}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when snapshot is null', () => {
    const { container } = render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={null}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header with snapshot version, formatted date, and author name', () => {
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Snapshot Details & Diff')).toBeInTheDocument();
    expect(screen.getByText('Sarah Developer')).toBeInTheDocument();
  });

  it('falls back to createdByUserId or Admin when createdByUserName is absent', () => {
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={{
          ...baseMockSnapshot,
          createdByUserName: null,
          createdByUserId: 'user-1234',
        }}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    expect(screen.getByText('user-1234')).toBeInTheDocument();
  });

  it('displays "Live Canvas" badge when isCurrentVersion is true', () => {
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={true}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    expect(screen.getByText('Live Canvas')).toBeInTheDocument();
  });

  it('computes diff entries against current live page', () => {
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    // Title diff
    expect(screen.getByText('Title')).toBeInTheDocument();
    // Slug diff
    expect(screen.getByText('Slug')).toBeInTheDocument();
    // Canvas components count diff (3 elements vs 4 elements)
    expect(screen.getByText('Canvas Components Count')).toBeInTheDocument();

    // Embedded Page Schema additions (Featured Products schema was in v2, but not in live page)
    expect(
      screen.getByText('Page Schema: Featured Products'),
    ).toBeInTheDocument();

    // Single entity field changes in Hero Banner
    expect(
      screen.getByText('[Hero Banner Schema (Entity)] heading'),
    ).toBeInTheDocument();

    // Direct page field diff
    expect(screen.getByText('Page Field: description')).toBeInTheDocument();
  });

  it('computes diff entries against previous snapshot when compareTarget is switched', () => {
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'previous' } });

    // In previous snapshot:
    // 1. Hero banner had only heading, v2 has heading and subheading definitions
    expect(
      screen.getByText('[Hero Banner Schema] Field Definitions'),
    ).toBeInTheDocument();

    // 2. Featured Products total entities changed from 1 to 2
    expect(
      screen.getByText('[Featured Products Schema] Total Entities'),
    ).toBeInTheDocument();

    // 3. Featured Products item 1 price changed from 89 to 99
    expect(
      screen.getByText('[Featured Products Schema > Warm Jacket] price'),
    ).toBeInTheDocument();
  });

  it('switches to Snapshot Payload tab and copies JSON payload', () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    const payloadTab = screen.getByText('Snapshot Payload');
    fireEvent.click(payloadTab);

    // Verify JSON payload text is shown
    expect(screen.getByText(/Discover Awesome Products/)).toBeInTheDocument();

    // Click copy button
    const copyBtn = screen.getByText('Copy JSON');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      JSON.stringify(baseMockSnapshot.data, null, 2),
    );

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it('calls onRevert with snapshot version number when Restore button is clicked', () => {
    const onRevertMock = vi.fn();
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={onRevertMock}
        isReverting={false}
      />,
    );

    const restoreBtn = screen.getByText('Restore This Snapshot');
    expect(restoreBtn).not.toBeDisabled();
    fireEvent.click(restoreBtn);

    expect(onRevertMock).toHaveBeenCalledWith(2);
  });

  it('disables Restore button when isReverting is true or isCurrentVersion is true', () => {
    const { rerender } = render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={true}
      />,
    );

    expect(screen.getByText('Restoring...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restoring/i })).toBeDisabled();

    rerender(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={vi.fn()}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={true}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Restore This Snapshot/i }),
    ).toBeDisabled();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <SnapshotDetailDeck
        isOpen={true}
        onClose={onCloseMock}
        snapshot={baseMockSnapshot}
        previousSnapshot={previousSnapshot}
        currentPageData={currentPageData}
        isCurrentVersion={false}
        onRevert={vi.fn()}
        isReverting={false}
      />,
    );

    const closeButtons = screen.getAllByRole('button');
    // First button in header is close (X)
    fireEvent.click(closeButtons[0]!);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
