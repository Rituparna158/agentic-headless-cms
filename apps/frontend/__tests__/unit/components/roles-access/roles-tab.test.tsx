import type { RoleRecord, SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
  applicationId: 'HEADLESS_CMS',
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
    mockListRoles.mockResolvedValue({ data: [editorRole], meta: { total: 1 } });
    mockListSchemas.mockResolvedValue({
      data: [blogSchema],
      meta: { total: 1 },
    });
  });
  it('defaults to the "New Role" form', async () => {
    renderTab();
    expect(await screen.findByText('New Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: 'Save' }));
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
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mockUpdateRole).toHaveBeenCalledWith(
        'role-1',
        expect.objectContaining({ id: 'role-1', name: 'Editor' }),
      ),
    );
    expect(mockCreateRole).not.toHaveBeenCalled();
  });

  it('allows writing a JSON condition in the Row-Level Condition textarea and includes it in saved permissions', async () => {
    mockCreateRole.mockResolvedValue({ ...editorRole, id: 'role-3' });
    const user = userEvent.setup();
    renderTab();

    await screen.findByText('New Role');
    await user.type(
      screen.getByPlaceholderText('e.g. Content Editor'),
      'Author Only',
    );

    const conditionTextarea = screen.getByPlaceholderText(
      'e.g. { "author": "$currentUser" }',
    );
    expect(conditionTextarea).toHaveValue('');

    fireEvent.change(conditionTextarea, {
      target: { value: '{"author":"$currentUser"}' },
    });
    expect(conditionTextarea).toHaveValue('{"author":"$currentUser"}');

    const row = screen.getByRole('row', { name: /Blog Post/ });
    await user.click(within(row).getAllByRole('checkbox')[0]!);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockCreateRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Author Only',
          permissions: [
            expect.objectContaining({
              schemaId: 'schema-1',
              action: 'read',
              condition: { author: '$currentUser' },
            }),
          ],
        }),
      ),
    );
  });

  it('displays a validation error and disables Save when condition JSON is invalid', async () => {
    const user = userEvent.setup();
    renderTab();

    await screen.findByText('New Role');
    await user.type(
      screen.getByPlaceholderText('e.g. Content Editor'),
      'Test Role',
    );

    const conditionTextarea = screen.getByPlaceholderText(
      'e.g. { "author": "$currentUser" }',
    );
    fireEvent.change(conditionTextarea, {
      target: { value: '{ author: invalid_json }' },
    });

    expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('populates row-level condition from an existing role', async () => {
    const roleWithCondition: RoleRecord = {
      ...editorRole,
      id: 'role-restricted',
      name: 'Restricted Editor',
      permissions: [
        {
          id: 'perm-1',
          roleId: 'role-restricted',
          schemaId: 'schema-1',
          action: 'read',
          effect: 'allow',
          fields: null,
          condition: { author: '$currentUser' },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    mockListRoles.mockResolvedValue({
      data: [roleWithCondition],
      meta: { total: 1 },
    });

    const user = userEvent.setup();
    renderTab();

    await user.click(
      await screen.findByRole('button', { name: 'Restricted Editor' }),
    );
    expect(screen.getByText('Role: Restricted Editor')).toBeInTheDocument();

    const conditionTextarea = screen.getByPlaceholderText(
      'e.g. { "author": "$currentUser" }',
    );
    expect(conditionTextarea).toHaveValue(
      JSON.stringify({ author: '$currentUser' }, null, 2),
    );
  });

  it('preserves wildcard (*) permissions for admin and disables schema checkboxes', async () => {
    const adminRole: RoleRecord = {
      ...editorRole,
      id: 'role-admin',
      name: 'admin',
      isSystem: true,
      permissions: [
        {
          id: 'perm-admin',
          roleId: 'role-admin',
          schemaId: null,
          action: '*',
          effect: 'allow',
          fields: null,
          condition: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    mockListRoles.mockResolvedValue({
      data: [adminRole],
      meta: { total: 1 },
    });
    mockUpdateRole.mockResolvedValue(adminRole);

    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole('button', { name: /admin/i }));
    expect(screen.getByText(/Full Wildcard Access \(\*\)/)).toBeInTheDocument();

    const row = screen.getByRole('row', { name: /Blog Post/ });
    const checkboxes = within(row).getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    });

    await user.type(
      screen.getByPlaceholderText('Optional description'),
      'Full access',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockUpdateRole).toHaveBeenCalledWith(
        'role-admin',
        expect.objectContaining({
          description: 'Full access',
          permissions: [
            expect.objectContaining({
              schemaId: null,
              action: '*',
              effect: 'allow',
            }),
          ],
        }),
      ),
    );
  });

  it('allows non-system wildcard roles to explicitly switch to granular permissions', async () => {
    const customWildcardRole: RoleRecord = {
      ...editorRole,
      id: 'role-custom-admin',
      name: 'Super Editor',
      isSystem: false,
      permissions: [
        {
          id: 'perm-wild',
          roleId: 'role-custom-admin',
          schemaId: null,
          action: '*',
          effect: 'allow',
          fields: null,
          condition: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    mockListRoles.mockResolvedValue({
      data: [customWildcardRole],
      meta: { total: 1 },
    });
    mockUpdateRole.mockResolvedValue({
      ...customWildcardRole,
      permissions: [],
    });

    const user = userEvent.setup();
    renderTab();

    await user.click(
      await screen.findByRole('button', { name: 'Super Editor' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Customize per content type' }),
    );

    const row = screen.getByRole('row', { name: /Blog Post/ });
    const firstCheckbox = within(row).getAllByRole('checkbox')[0]!;
    expect(firstCheckbox).not.toBeDisabled();
    await user.click(firstCheckbox);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockUpdateRole).toHaveBeenCalledWith(
        'role-custom-admin',
        expect.objectContaining({
          permissions: [
            expect.objectContaining({
              schemaId: 'schema-1',
              action: 'read',
            }),
          ],
        }),
      ),
    );
  });
});
