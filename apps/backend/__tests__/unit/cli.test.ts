import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Setup mock action capturer for CAC
const mockAction = vi.fn().mockReturnThis();
const mockOption = vi.fn().mockReturnThis();
const mockCommand = vi.fn().mockReturnThis();
const mockParse = vi.fn();

vi.mock('cac', () => ({
  cac: () => ({
    command: mockCommand,
    option: mockOption,
    action: mockAction,
    help: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    parse: mockParse,
  }),
}));

// 2. Mock Database and specific tables
const mockInsertValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn().mockResolvedValue([{ id: 'mock-id' }]);

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(),
  },
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: () => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockImplementation(() => ({
      values: mockInsertValues.mockImplementation(() => ({
        returning: mockReturning,
        then: (cb: () => void) => cb(),
      })),
    })),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('@repo/db/schema', () => ({
  users: { id: 'users' },
  applications: { id: 'applications' },
  roles: { id: 'roles' },
  userRoles: { id: 'userRoles' },
  userApplications: { id: 'userApplications' },
  permissions: { id: 'permissions' },
}));

vi.mock('@repo/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  password: vi.fn(),
}));

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi
      .fn()
      .mockReturnValue({ toString: () => 'mock-random-string' }),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

vi.mock('otplib', () => ({
  authenticator: {
    generateSecret: vi.fn().mockReturnValue('mocked-secret'),
  },
}));

const mockExit = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as unknown as (
    code?: string | number | null | undefined,
  ) => never);

describe('CLI Script - Setup Command', () => {
  let setupActionFn: (options: Record<string, unknown>) => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockInsertValues.mockClear();

    // Import the module. This registers the action with CAC.
    await import('../../src/cli.js');

    // Extract the action function that was passed to .action() for the 'setup' command
    // The setup command is the first command registered, so it's the first call to action()
    setupActionFn = mockAction.mock.calls[0]![0];
  });

  it('should push TWO default records when --auto is used with no other flags', async () => {
    await setupActionFn({ auto: true });

    // We should not exit with an error
    expect(mockExit).toHaveBeenCalledWith(0);

    // Verify that the two default applications were inserted
    const insertAppCalls = mockInsertValues.mock.calls.filter(
      (call) => call[0].name === 'CMS_UI' || call[0].name === 'HEADLESS_CMS',
    );
    expect(insertAppCalls.length).toBe(2);
    expect(insertAppCalls[0]![0].name).toBe('CMS_UI');
    expect(insertAppCalls[1]![0].name).toBe('HEADLESS_CMS');

    // Verify that the two distinct users were inserted
    const insertUserCalls = mockInsertValues.mock.calls.filter(
      (call) => call[0].email && call[0].email.includes('@agentic-cms.com'),
    );
    expect(insertUserCalls.length).toBe(2);
    expect(insertUserCalls[0]![0].email).toBe('cmsui-admin@agentic-cms.com');
    expect(insertUserCalls[1]![0].email).toBe('headless-admin@agentic-cms.com');
  });

  it('should push ONE custom record when custom flags are provided alongside --auto', async () => {
    await setupActionFn({
      auto: true,
      appName: 'My Custom App',
      email: 'custom@test.com',
      password: 'pass',
    });

    expect(mockExit).toHaveBeenCalledWith(0);

    // Verify exactly ONE custom app was created
    const insertAppCalls = mockInsertValues.mock.calls.filter(
      (call) => call[0].name === 'My Custom App',
    );
    expect(insertAppCalls.length).toBe(1);
    expect(insertAppCalls[0]![0].name).toBe('My Custom App');

    // Verify exactly ONE custom user was created
    const insertUserCalls = mockInsertValues.mock.calls.filter(
      (call) => call[0].email === 'custom@test.com',
    );
    expect(insertUserCalls.length).toBe(1);
    expect(insertUserCalls[0]![0].email).toBe('custom@test.com');
  });

  it('should disable MFA by default during --auto setup', async () => {
    await setupActionFn({ auto: true });

    // Extract all user insertion calls
    const insertUserCalls = mockInsertValues.mock.calls.filter(
      (call) => call[0].email && call[0].email.includes('@agentic-cms.com'),
    );

    // Verify mfaEnabled is set to false for both users
    expect(insertUserCalls[0]![0].mfaEnabled).toBe(false);
    expect(insertUserCalls[1]![0].mfaEnabled).toBe(false);
  });
});
