import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SectionMenuConnector } from '../../../../src/features/site-content/components/SectionMenuConnector';

const menus = [
  { id: 'header-primary', name: 'Header Primary Navigation' },
  { id: 'footer-links', name: 'Footer Legal & Resources' },
];

describe('SectionMenuConnector', () => {
  it('detects when no menu is connected and allows connecting one', () => {
    const onHtmlChange = vi.fn();
    render(
      <MemoryRouter>
        <SectionMenuConnector
          secHtml="<header><h1>Site Title</h1></header>"
          onHtmlChange={onHtmlChange}
          secRole="header"
          siteId="esite"
          availableMenus={menus}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/No dynamic menu is connected/i),
    ).toBeInTheDocument();
    const connectBtn = screen.getByRole('button', {
      name: /Connect Dynamic Menu/i,
    });
    fireEvent.click(connectBtn);

    expect(onHtmlChange).toHaveBeenCalledWith(
      expect.stringContaining('data-cms-menu="header-primary"'),
    );
  });

  it('detects an existing connected menu and allows switching it', () => {
    const onHtmlChange = vi.fn();
    render(
      <MemoryRouter>
        <SectionMenuConnector
          secHtml='<nav data-cms-menu="header-primary"></nav>'
          onHtmlChange={onHtmlChange}
          secRole="header"
          siteId="esite"
          availableMenus={menus}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Connected: Header Primary Navigation/i),
    ).toBeInTheDocument();

    const select = screen.getByLabelText(/Switch navigation menu/i);
    fireEvent.change(select, { target: { value: 'footer-links' } });

    expect(onHtmlChange).toHaveBeenCalledWith(
      '<nav data-cms-menu="footer-links"></nav>',
    );
  });

  it('detects static links and replaces them when connecting dynamic menu', () => {
    const onHtmlChange = vi.fn();
    const staticHtml = `<nav id="navbar"><div id="links"><a href="/">Home</a><a href="/about">About</a></div></nav>`;

    render(
      <MemoryRouter>
        <SectionMenuConnector
          secHtml={staticHtml}
          onHtmlChange={onHtmlChange}
          secRole="header"
          siteId="esite"
          availableMenus={menus}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Detected static/i)).toBeInTheDocument();
    const connectBtn = screen.getByRole('button', {
      name: /Connect Dynamic Menu/i,
    });
    fireEvent.click(connectBtn);

    expect(onHtmlChange).toHaveBeenCalledWith(
      expect.stringContaining('data-cms-menu="header-primary"'),
    );
    expect(onHtmlChange).not.toHaveBeenCalledWith(
      expect.stringContaining('<a href="/">Home</a>'),
    );
  });

  it('allows disconnecting an active menu', () => {
    const onHtmlChange = vi.fn();
    render(
      <MemoryRouter>
        <SectionMenuConnector
          secHtml='<div class="header" data-cms-menu="header-primary"></div>'
          onHtmlChange={onHtmlChange}
          secRole="header"
          siteId="esite"
          availableMenus={menus}
        />
      </MemoryRouter>,
    );

    const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
    fireEvent.click(disconnectBtn);

    expect(onHtmlChange).toHaveBeenCalledWith('<div class="header"></div>');
  });
});
