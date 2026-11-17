import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateImportModal } from '../../../../src/features/collections/components/template/TemplateImportModal';

describe('TemplateImportModal', () => {
  const dummyPages = [
    {
      id: 'page-1',
      title: 'About Page',
      slug: '/about',
      data: {
        body: {
          builder: 'grapesjs',
          html: '<h1>About Us</h1>',
          css: 'h1 { color: red; }',
          projectData: { pages: [{ name: 'About' }] },
        },
      },
    },
    {
      id: 'page-2',
      title: 'Contact Page',
      slug: '/contact',
      data: {
        body: {
          builder: 'grapesjs',
          html: '<form>Contact</form>',
          css: '',
        },
      },
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TemplateImportModal
        isOpen={false}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders upload tab by default', () => {
    render(
      <TemplateImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImport={vi.fn()}
        availablePages={dummyPages}
      />,
    );

    expect(screen.getByText('Import JSON Template')).toBeInTheDocument();
    expect(screen.getByText('Upload JSON Template')).toBeInTheDocument();
    expect(
      screen.getByText(/Inherit from Existing Page \(2\)/i),
    ).toBeInTheDocument();
  });

  it('allows switching to inherit tab and inheriting page design', () => {
    const onImport = vi.fn();
    const onClose = vi.fn();

    render(
      <TemplateImportModal
        isOpen={true}
        onClose={onClose}
        onImport={onImport}
        availablePages={dummyPages}
      />,
    );

    // Switch to inherit tab
    const inheritTabBtn = screen.getByText(/Inherit from Existing Page/i);
    fireEvent.click(inheritTabBtn);

    expect(
      screen.getByRole('heading', { name: 'Inherit Page Design' }),
    ).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Select 'About Page'
    fireEvent.change(select, { target: { value: 'page-1' } });
    expect(screen.getByText('About Page')).toBeInTheDocument();

    // Click 'Inherit Page Design'
    const inheritBtn = screen.getByRole('button', {
      name: /Inherit Page Design/i,
    });
    expect(inheritBtn).toBeEnabled();
    fireEvent.click(inheritBtn);

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledWith({
      success: true,
      data: dummyPages[0]!.data.body,
      projectData: dummyPages[0]!.data.body.projectData,
      html: '<h1>About Us</h1>',
      css: 'h1 { color: red; }',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
