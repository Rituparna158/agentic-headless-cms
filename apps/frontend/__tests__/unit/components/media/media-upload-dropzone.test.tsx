import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaUploadDropzone } from '@/components/media/media-upload-dropzone';

const { mockUpload } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
}));

vi.mock('@/lib/api/media', () => ({
  uploadMedia: mockUpload,
}));

function renderDropzone() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MediaUploadDropzone />
    </QueryClientProvider>,
  );
}

describe('MediaUploadDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a drop zone with an accessible file input', () => {
    renderDropzone();
    expect(screen.getByLabelText(/upload files/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
  });

  it('uploads a dropped file via uploadMedia', async () => {
    mockUpload.mockResolvedValue({
      id: 'asset-1',
      filename: 'hero.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      width: 100,
      height: 100,
      url: '/media/file/hero.jpg',
      altText: null,
      folderId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderDropzone();

    const file = new File(['content'], 'hero.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload files/i) as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(file, { folderId: undefined });
    });
  });

  it('shows an error message when the upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('network down'));

    renderDropzone();

    const file = new File(['content'], 'hero.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload files/i) as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to upload/i);
    });
  });
});
