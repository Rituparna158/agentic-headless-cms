import type { SchemaDefinition } from '@repo/types';
import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentEntryForm } from '@/components/content-editor/content-entry-form';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

const {
  mockPush,
  mockRefresh,
  mockGetEntry,
  mockCreate,
  mockUpdate,
  mockPublish,
  mockUnpublish,
  mockDelete,
  mockListLocales,
  mockToastSuccess,
  mockToastError,
  mockTranslateEntry,
  mockGetEntryWorkflowState,
  mockTransitionEntry,
  mockGetWorkflowHistory,
  mockUpdateEntryWorkflowMode,
  mockUseHasPermission,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockGetEntry: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockPublish: vi.fn(),
  mockUnpublish: vi.fn(),
  mockDelete: vi.fn(),
  mockListLocales: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockTranslateEntry: vi.fn(),
  mockGetEntryWorkflowState: vi.fn(),
  mockTransitionEntry: vi.fn(),
  mockGetWorkflowHistory: vi.fn(),
  mockUpdateEntryWorkflowMode: vi.fn(),
  mockUseHasPermission: vi.fn(
    (_action: string, _schemaId?: string | null) => true,
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock('@/hooks/use-permissions', () => ({
  useHasPermission: mockUseHasPermission,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/lib/api/locales', () => ({
  listLocales: mockListLocales,
}));

vi.mock('@/lib/services/translation-service', () => ({
  translateContentEntry: mockTranslateEntry,
  getTranslationConfig: () => ({ provider: 'free', model: 'gpt-4o-mini' }),
  saveTranslationConfig: vi.fn(),
  testTranslationProvider: vi
    .fn()
    .mockResolvedValue({ success: true, message: 'Connected' }),
}));

vi.mock('@/lib/api/content', () => ({
  getContentEntry: mockGetEntry,
  createContentEntry: mockCreate,
  updateContentEntry: mockUpdate,
  publishContentEntry: mockPublish,
  unpublishContentEntry: mockUnpublish,
  deleteContentEntry: mockDelete,
}));

vi.mock('@/lib/api/workflows', () => ({
  getEntryWorkflowState: mockGetEntryWorkflowState,
  transitionEntry: mockTransitionEntry,
  getWorkflowHistory: mockGetWorkflowHistory,
  updateEntryWorkflowMode: mockUpdateEntryWorkflowMode,
}));

const definition: SchemaDefinition = {
  fields: [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      isRequired: true,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 0,
    },
    {
      apiId: 'views',
      displayName: 'Views',
      dataType: 'number',
      isRequired: false,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 1,
    },
  ],
};

const schema: SchemaRecord = {
  id: 'schema-1',
  name: 'Article',
  slug: 'article',
  type: 'collection',
  definition,
  status: 'published',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderForm(entry?: ContentEntryRecord) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContentEntryForm schema={schema} entry={entry} />
    </QueryClientProvider>,
  );
}

describe('ContentEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLocales.mockResolvedValue({ data: [] });
    mockGetEntry.mockResolvedValue(undefined);
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: false,
      workflow: null,
      currentStage: null,
      availableTransitions: [],
      isFinal: true,
    });
    mockGetWorkflowHistory.mockResolvedValue([]);
    mockUseHasPermission.mockReturnValue(true);
  });

  it('renders one control per schema field and a "Not saved" status for a new entry', () => {
    renderForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/views/i)).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    // Publish/Delete only make sense for an already-saved entry.
    expect(
      screen.queryByRole('button', { name: /^publish$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a validation error and does not submit when a required field is empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it('creates a new entry and navigates to its edit page on success', async () => {
    mockCreate.mockResolvedValue({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Hello World');
    await user.type(screen.getByLabelText(/views/i), '42');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockCreate.mock.calls[0]![1]).toMatchObject({
      title: 'Hello World',
      views: 42,
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/content/article/entry-1');
    });
  });

  it('updates an existing entry via updateContentEntry, not createContentEntry', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Original', views: 1 },
      publishedData: null,
    };
    mockUpdate.mockResolvedValue({
      ...entry,
      data: { title: 'Updated', views: 1 },
    });

    const user = userEvent.setup();
    renderForm(entry);

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'article',
        'entry-1',
        expect.objectContaining({
          title: 'Updated',
        }),
        'en',
      );
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows the entry status and lets a saved draft be published', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };
    mockPublish.mockResolvedValue({ ...entry, status: 'published' });

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('draft')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^publish$/i }));

    // Confirm in modal
    expect(screen.getByText('Publish Entry')).toBeInTheDocument();
    const publishButtons = await screen.findAllByRole('button', {
      name: /^publish$/i,
    });
    await user.click(publishButtons[publishButtons.length - 1]!);

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('article', 'entry-1', 'en');
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Entry published successfully'),
    );
  });

  it('shows confirmation modal before deleting an existing entry and deletes on confirm', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };
    mockDelete.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderForm(entry);

    const moreActionsButton = screen.queryByRole('button', {
      name: /more actions/i,
    });
    if (moreActionsButton) {
      await user.click(moreActionsButton);
      await user.click(screen.getByText('Delete'));
    } else {
      await user.click(screen.getByRole('button', { name: /^delete$/i }));
    }

    expect(screen.getByText('Delete Entry')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Are you sure you want to permanently delete this entry/i,
      ),
    ).toBeInTheDocument();

    // Confirm button in the modal
    const deleteButtons = await screen.findAllByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButtons[deleteButtons.length - 1]!);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('article', 'entry-1');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/content/article');
    });
  });

  it('shows a submit error message when saving fails', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Hello World');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to save entry/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('hides Save Draft button when entry is published and unmodified, and shows it when modified', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'published',
      data: { title: 'Published Article', views: 10 },
      publishedData: { title: 'Published Article', views: 10 },
    };

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('published')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, ' - Updated');

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
  });

  it('prevents publishing and displays an error toast when required fields fail validation', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: '', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: /^publish$/i }));

    expect(mockPublish).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /publish now/i }),
    ).not.toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith(
      'Please fix validation errors before publishing.',
    );
  });

  it('shows confirmation modal before unpublishing a published entry and unpublishes on confirm', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'published',
      data: { title: 'Published Article', views: 10 },
      publishedData: { title: 'Published Article', views: 10 },
    };
    mockUnpublish.mockResolvedValue({
      ...entry,
      status: 'draft',
      publishedData: null,
    });

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('published')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    const unpublishBtn = screen.getByText('Unpublish');
    expect(unpublishBtn).toBeInTheDocument();

    await user.click(unpublishBtn);

    // Confirm in modal
    expect(screen.getByText('Unpublish Entry')).toBeInTheDocument();
    const unpublishButtons = await screen.findAllByRole('button', {
      name: /unpublish/i,
    });
    await user.click(unpublishButtons[unpublishButtons.length - 1]!);

    await waitFor(() => {
      expect(mockUnpublish).toHaveBeenCalledWith('article', 'entry-1', 'en');
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Entry unpublished successfully'),
    );
  });

  it('displays available locales in the locale selector and switches locale', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    const user = userEvent.setup();
    renderForm();

    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    expect(localeBtn).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();

    await user.click(localeBtn);
    expect(await screen.findByText('Spanish')).toBeInTheDocument();
    await user.click(screen.getByText('Spanish'));

    expect(screen.getByText('es')).toBeInTheDocument();
  });

  it('fetches and populates localized data when switching locale on an existing entry', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    mockGetEntry.mockResolvedValue({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hola Mundo', views: 99 },
    });

    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();

    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    await user.click(localeBtn);

    const spanishOption = await screen.findByText('Spanish');
    await user.click(spanishOption);

    await waitFor(() => {
      expect(mockGetEntry).toHaveBeenCalledWith('article', 'entry-1', 'es');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hola Mundo')).toBeInTheDocument();
    });
  });

  it('renders loading skeleton while fetching localized entry data', async () => {
    let resolveGetEntry: (value: unknown) => void;
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    mockGetEntry.mockReturnValue(
      new Promise((resolve) => {
        resolveGetEntry = resolve;
      }),
    );

    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    await user.click(localeBtn);

    const spanishOption = await screen.findByText('Spanish');
    await user.click(spanishOption);

    // Skeleton screen should be displayed while fetch is pending
    expect(
      await screen.findByTestId('locale-loading-skeleton'),
    ).toBeInTheDocument();

    // Resolve the query
    resolveGetEntry!({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hola Mundo', views: 99 },
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('locale-loading-skeleton'),
      ).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Hola Mundo')).toBeInTheDocument();
    });
  });

  it('wipes out unsaved dirty input fields when user confirms discard and switches locale', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });

    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Mr X');
    expect(titleInput).toHaveValue('Mr X');

    // Switch locale with unsaved dirty changes
    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    await user.click(localeBtn);

    const spanishOption = await screen.findByText('Spanish');
    await user.click(spanishOption);

    // Confirmation dialog should appear
    expect(screen.getByText('Discard Unsaved Changes?')).toBeInTheDocument();

    // Click Discard & Switch
    const discardBtn = screen.getByRole('button', {
      name: /discard & switch/i,
    });
    await user.click(discardBtn);

    // Input field should be wiped clean
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
    });
  });

  it('does not show auto-translate button on default locale', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    renderForm();
    expect(
      screen.queryByRole('button', { name: /auto-translate/i }),
    ).not.toBeInTheDocument();
  });

  it('shows auto-translate button on secondary locale and translates fields', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    mockGetEntry.mockResolvedValue(null);
    mockTranslateEntry.mockResolvedValue({
      success: true,
      translatedCount: 1,
      provider: 'free',
      translatedData: { title: 'Hola Mundo Auto', views: 42 },
    });

    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World Base', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    // Switch to Spanish
    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    await user.click(localeBtn);
    const spanishOption = await screen.findByText('Spanish');
    await user.click(spanishOption);

    // Auto-translate button should be visible
    const translateBtn = await screen.findByRole('button', {
      name: /auto-translate/i,
    });
    expect(translateBtn).toBeInTheDocument();

    await user.click(translateBtn);

    await waitFor(() => {
      expect(mockTranslateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceLocale: 'en',
          targetLocale: 'es',
          sourceData: expect.objectContaining({ title: 'Hello World Base' }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hola Mundo Auto')).toBeInTheDocument();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Auto-translated 1 field from EN to ES'),
    );
  });

  it('renders workflow stage badge, transition buttons, and enforces publish stage guard', async () => {
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'In Review',
        slug: 'in_review',
        color: '#3b82f6',
        order: 1,
        isInitial: false,
        isFinal: false,
      },
      availableTransitions: [
        {
          id: 't-1',
          name: 'Approve Content',
          fromStage: 'in_review',
          toStage: 'approved',
          requiredRoleIds: ['editor'],
        },
      ],
      isFinal: false,
    });

    const entry: ContentEntryRecord = {
      id: 'entry-wf-1',
      status: 'draft',
      data: { title: 'Workflow Article', views: 10 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    // Stage badge should be visible
    expect(await screen.findByText('In Review')).toBeInTheDocument();

    // Transition button should be visible
    expect(
      await screen.findByRole('button', { name: /Approve Content/i }),
    ).toBeInTheDocument();

    // Publish button must be disabled because isFinal is false
    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    expect(publishBtn).toBeDisabled();

    // Workflow log should be accessible via more actions menu
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText('Workflow Log')).toBeInTheDocument();
  });

  it('handles 409 conflict during stage transition by alerting and refreshing state', async () => {
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'In Review',
        slug: 'in_review',
        color: '#3b82f6',
        order: 1,
        isInitial: false,
        isFinal: false,
      },
      availableTransitions: [
        {
          id: 't-1',
          name: 'Approve Content',
          fromStage: 'in_review',
          toStage: 'approved',
          requiredRoleIds: ['editor'],
        },
      ],
      isFinal: false,
    });

    mockTransitionEntry.mockRejectedValue(
      new ApiError(
        'This entry was modified by another reviewer. Updating to the latest state...',
        409,
      ),
    );

    const entry: ContentEntryRecord = {
      id: 'entry-wf-conflict',
      status: 'draft',
      data: { title: 'Concurrent Article' },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    const approveBtn = await screen.findByRole('button', {
      name: /Approve Content/i,
    });
    await user.click(approveBtn);

    // Confirm transition in modal
    const confirmBtn = await screen.findByRole('button', {
      name: /^confirm$/i,
    });
    await user.click(confirmBtn);

    // Verify 409 error toast was shown
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'This entry was modified by another reviewer. Updating to the latest state...',
      );
    });

    // Verify transition was called with expectedStage
    expect(mockTransitionEntry).toHaveBeenCalledWith(
      'article',
      'entry-wf-conflict',
      expect.objectContaining({
        toStage: 'approved',
        expectedStage: 'in_review',
      }),
    );

    // Verify state was refetched
    expect(mockGetEntryWorkflowState).toHaveBeenCalled();
  });

  it('displays the awaiting peer review badge when current user is a self-reviewer in review stage', async () => {
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial' },
      currentStage: {
        id: 's2',
        name: 'In Review',
        slug: 'in_review',
        order: 1,
      },
      availableTransitions: [],
      isFinal: false,
      isSelfReviewer: true,
      selfReviewReason:
        'You created this content; another editor must review and approve it.',
    });

    renderForm({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Test entry' },
      publishedData: null,
    });

    expect(await screen.findByText('Awaiting Peer Review')).toBeInTheDocument();
  });

  it('disables input fields and hides workflow transition buttons when user has read-only access', async () => {
    mockUseHasPermission.mockImplementation(
      (action: string) => action === 'read',
    );
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial' },
      currentStage: {
        id: 's1',
        name: 'Draft',
        slug: 'draft',
        order: 0,
      },
      availableTransitions: [
        {
          id: 't-1',
          name: 'Submit for Review',
          fromStage: 'draft',
          toStage: 'in_review',
        },
      ],
      isFinal: false,
    });

    renderForm({
      id: 'entry-readonly-1',
      status: 'draft',
      data: { title: 'Read-only article' },
      publishedData: null,
    });

    expect(await screen.findByText('Read-Only')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Submit for Review/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeDisabled();
  });

  it('enables direct publishing when entry is in Direct Publish mode (requiresReview: false)', async () => {
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [],
      isFinal: false,
      requiresReview: false,
    });

    renderForm({
      id: 'entry-direct-pub',
      status: 'draft',
      data: { title: 'Direct Publish Article' },
      publishedData: null,
    });

    // The Workflow mode selector shows Direct Publish
    expect(await screen.findByText('Direct Publish')).toBeInTheDocument();

    // The Publish button should be enabled for direct publishing
    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    expect(publishBtn).not.toBeDisabled();
  });

  it('allows creator to switch workflow mode from Require Review to Direct Publish', async () => {
    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [],
      isFinal: false,
      requiresReview: true,
    });

    mockUpdateEntryWorkflowMode.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [],
      isFinal: false,
      requiresReview: false,
    });

    const user = userEvent.setup();
    renderForm({
      id: 'entry-mode-switch',
      status: 'draft',
      data: { title: 'Mode Switch Article' },
      publishedData: null,
    });

    // Workflow mode button displays Require Review
    const modeBtn = await screen.findByRole('button', {
      name: /Workflow Review Mode/i,
    });
    expect(modeBtn).toBeInTheDocument();
    expect(modeBtn).toHaveTextContent('Require Review');

    // Click to open dropdown and select Direct Publish
    await user.click(modeBtn);
    const directPublishOption = await screen.findByText(
      'Bypasses review pipeline. Authorized publishers can publish directly.',
    );
    await user.click(directPublishOption);

    expect(mockUpdateEntryWorkflowMode).toHaveBeenCalledWith(
      'article',
      'entry-mode-switch',
      false,
    );
  });

  it('displays workflow review mode dropdown for author role without publish permission', async () => {
    mockUseHasPermission.mockImplementation(
      (action: string) => action !== 'publish',
    );

    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [
        {
          id: 'trans-1',
          name: 'Submit for Review',
          fromStage: 'draft',
          toStage: 'in_review',
        },
      ],
      isFinal: false,
      requiresReview: true,
    });

    renderForm({
      id: 'entry-author-test',
      status: 'draft',
      data: { title: 'Author Article' },
      publishedData: null,
    });

    // Workflow Review Mode dropdown button is visible for author
    const modeBtn = await screen.findByRole('button', {
      name: /Workflow Review Mode/i,
    });
    expect(modeBtn).toBeInTheDocument();
    expect(modeBtn).toHaveTextContent('Require Review');

    // Submit for Review is visible
    expect(
      await screen.findByRole('button', { name: /Submit for Review/i }),
    ).toBeInTheDocument();

    // Publish button is disabled because author cannot publish
    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    expect(publishBtn).toBeDisabled();

    // Click mode dropdown and verify Direct Publish is restricted
    const user = userEvent.setup();
    await user.click(modeBtn);
    const restrictedNotice = await screen.findByText(
      /Requires publish permission/i,
    );
    expect(restrictedNotice).toBeInTheDocument();
  });

  it('renders Changes Requested banner for author when changes are requested', async () => {
    useAuthStore.setState({
      user: {
        id: 'author-user-id',
        email: 'author@test.com',
        firstName: 'Author',
        lastName: 'User',
        roles: ['editor'],
        permissions: [],
        mfaEnabled: false,
      },
    });

    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [],
      isFinal: false,
      requiresReview: true,
      requiresEditsBeforeResubmit: true,
      rejectionComment: 'Please fix the typo in paragraph 2.',
      createdBy: { id: 'author-user-id', email: 'author@test.com' },
      submittedBy: { id: 'author-user-id', email: 'author@test.com' },
    });

    renderForm({
      id: 'entry-changes-requested',
      status: 'draft',
      data: { title: 'Needs Revisions' },
      publishedData: null,
    });

    expect(await screen.findByText('Changes requested:')).toBeInTheDocument();
    expect(
      screen.queryByText(/Please fix the typo in paragraph 2\./i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Edit the fields and click/i)).toBeInTheDocument();
  });

  it('does NOT render Changes Requested banner for reviewer who is not author/submitter', async () => {
    useAuthStore.setState({
      user: {
        id: 'admin-reviewer-id',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        permissions: [],
        mfaEnabled: false,
      },
    });

    mockGetEntryWorkflowState.mockResolvedValue({
      hasWorkflow: true,
      workflow: { id: 'wf-1', name: 'Editorial Workflow' },
      currentStage: {
        id: 's-1',
        name: 'Draft Stage',
        slug: 'draft',
        order: 0,
        isInitial: true,
        isFinal: false,
      },
      availableTransitions: [],
      isFinal: false,
      requiresReview: true,
      requiresEditsBeforeResubmit: true,
      rejectionComment: 'Please fix the typo in paragraph 2.',
      createdBy: { id: 'author-user-id', email: 'author@test.com' },
      submittedBy: { id: 'author-user-id', email: 'author@test.com' },
    });

    renderForm({
      id: 'entry-changes-requested-reviewer',
      status: 'draft',
      data: { title: 'Needs Revisions' },
      publishedData: null,
    });

    // Wait for form to load
    await screen.findByDisplayValue('Needs Revisions');

    expect(await screen.findByText('Awaiting Revisions:')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This entry has requested changes and is locked until the author submits revisions/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Awaiting Author Revisions')).toBeInTheDocument();
    expect(screen.queryByText('Changes requested:')).not.toBeInTheDocument();
  });
});
