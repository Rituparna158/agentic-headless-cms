import type { RoleRecord, SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RolesTab } from '@/components/roles-access/roles-tab';

const { mockListRoles, mockCreateRole, mockUpdateRole, mockListSchemas } =
  vi.hoisted(() => ({
    mockListRoles: vi.fn(),
    mockCreateRole: vi.fn(),
    mockUpdateRole: vi.fn(),
    mockListSchemas: vi.fn(),
  }));

vi.mock('@/lib/api/access', () => ({
  listRoles: mockListRoles,
  createRole: mockCreateRole,
  updateRole: mockUpdateRole,
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

const editorRole: RoleRecord = {
  id: 'role-1',
  name: 'Editor',
  mfaRequired: false,
  isSystem: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  permissions: [],
};

const blogSchema: SchemaRecord = {
  id: 'schema-1',
  name: 'Blog Post',
  slug: 'blog-post',
  type: 'collection',
  definition: { fields: [] },
  status: 'published',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RolesTab />
    </QueryClientProvider>,
  );
}

describe('RolesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRoles.mockResolvedValue([editorRole]);
    mockListSchemas.mockResolvedValue([blogSchema]);
  });

  it('defaults to the "New Role" form', async () => {
    renderTab();
    expect(await screen.findByText('New Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Role' })).toBeDisabled();
  });

  it('shows an existing role when selected from the list', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole('button', { name: 'Editor' }));
    expect(screen.getByText('Role: Editor')).toBeInTheDocument();
  });

  it('creates a new role with the toggled permission', async () => {
    mockCreateRole.mockResolvedValue({ ...editorRole, id: 'role-2' });
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('New Role');

    await user.type(
      screen.getByPlaceholderText('e.g. Content Editor'),
      'Reviewer',
    );
    const row = screen.getByRole('row', { name: /Blog Post/ });
    await user.click(within(row).getAllByRole('checkbox')[0]!);
    await user.click(screen.getByRole('button', { name: 'Save Role' }));

    await waitFor(() =>
      expect(mockCreateRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Reviewer',
          permissions: [
            expect.objectContaining({ schemaId: 'schema-1', action: 'read' }),
          ],
        }),
      ),
    );
    expect(mockUpdateRole).not.toHaveBeenCalled();
  });

  it('updates an existing role instead of creating a new one', async () => {
    mockUpdateRole.mockResolvedValue(editorRole);
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole('button', { name: 'Editor' }));
    await user.click(screen.getByRole('button', { name: 'Save Role' }));

    await waitFor(() =>
      expect(mockUpdateRole).toHaveBeenCalledWith(
        'role-1',
        expect.objectContaining({ id: 'role-1', name: 'Editor' }),
      ),
    );
    expect(mockCreateRole).not.toHaveBeenCalled();
  });
});
