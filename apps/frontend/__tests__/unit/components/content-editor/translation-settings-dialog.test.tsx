import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationSettingsDialog } from '@/components/content-editor/translation-settings-dialog';

const {
  mockGetConfig,
  mockSaveConfig,
  mockTestProvider,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockGetConfig: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockTestProvider: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock('@/lib/services/translation-service', () => ({
  getTranslationConfig: mockGetConfig,
  saveTranslationConfig: mockSaveConfig,
  testTranslationProvider: mockTestProvider,
}));

describe('TranslationSettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue({
      provider: 'free',
      apiKey: '',
      model: 'gpt-4o-mini',
      customEndpoint: '',
    });
  });

  it('renders modal dialog when open is true', () => {
    render(<TranslationSettingsDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByText('Translation Provider Settings'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Free Machine Translation (Zero-Config)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('OpenAI (GPT-4o / GPT-4o-mini)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Custom Translation Endpoint')).toBeInTheDocument();
  });

  it('allows switching to OpenAI and configuring API key', async () => {
    const user = userEvent.setup();
    const mockOnConfigChange = vi.fn();
    const mockOnOpenChange = vi.fn();

    render(
      <TranslationSettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfigChange={mockOnConfigChange}
      />,
    );

    // Click OpenAI radio/card
    const openAiCard = screen.getByText('OpenAI (GPT-4o / GPT-4o-mini)');
    await user.click(openAiCard);

    // Key input should be visible
    const keyInput = screen.getByPlaceholderText('sk-...');
    expect(keyInput).toBeInTheDocument();

    await user.type(keyInput, 'sk-test-secret-123');

    // Click Save Configuration
    const saveBtn = screen.getByRole('button', { name: /save configuration/i });
    await user.click(saveBtn);

    expect(mockSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        apiKey: 'sk-test-secret-123',
        model: 'gpt-4o-mini',
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Translation provider set to OpenAI'),
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('executes connection test and renders test feedback', async () => {
    const user = userEvent.setup();
    mockTestProvider.mockResolvedValue({
      success: true,
      message: 'Successfully connected to free provider.',
      sample: 'Hola mundo',
    });

    render(<TranslationSettingsDialog open={true} onOpenChange={vi.fn()} />);

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    await user.click(testBtn);

    await waitFor(() => {
      expect(mockTestProvider).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'free' }),
      );
    });

    expect(
      await screen.findByText('Successfully connected to free provider.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/sample: “hola mundo”/i)).toBeInTheDocument();
  });
});
