/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';

import { Sidebar } from '../../../src/components/Sidebar/Sidebar';
import { PageEditorHeader } from '../../../src/features/collections/pages/editors/components/PageEditorHeader';
import {
  LiveAnnouncerProvider,
  useLiveAnnouncer,
  LiveStatusBanner,
} from '../../../src/components/ui/LiveAnnouncer';
import { InlineErrorAlert } from '../../../src/components/ui/InlineErrorAlert';
import { EmptyStateCard } from '../../../src/components/ui/EmptyStateCard';
import { useFocusTrap } from '../../../src/hooks/useFocusTrap';
import { Files } from 'lucide-react';

// Mock auth store for Sidebar
vi.mock('../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: [
          { action: 'manage', condition: { capability: 'manage_content' } },
        ],
      },
    }),
}));

vi.mock('../../../src/features/auth/hooks/useAuthMutations', () => ({
  useLogoutMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Test helper component for useFocusTrap
const FocusTrapTestContainer: React.FC<{
  isOpen: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}> = ({ isOpen, onEscape, restoreFocus = true }) => {
  const trapRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape,
    restoreFocus,
  });

  return (
    <div>
      <button id="external-trigger" type="button">
        Trigger Button
      </button>
      {isOpen && (
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label="Modal Dialog Test"
          tabIndex={-1}
        >
          <input id="first-input" placeholder="First Field" />
          <button id="middle-btn" type="button">
            Middle Button
          </button>
          <button id="last-btn" type="button">
            Last Button
          </button>
        </div>
      )}
    </div>
  );
};

// Test helper component for useLiveAnnouncer
const LiveAnnouncerTestConsumer = () => {
  const { announce } = useLiveAnnouncer();
  return (
    <div>
      <button
        type="button"
        onClick={() => announce('Page saved to cloud successfully', 'polite')}
      >
        Trigger Polite Announcement
      </button>
      <button
        type="button"
        onClick={() => announce('Network connection failed', 'assertive')}
      >
        Trigger Assertive Alert
      </button>
    </div>
  );
};

describe('Automated Accessibility (WCAG 2.1 AA) & ARIA Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar Navigation A11y', () => {
    it('passes automated axe audit with zero violations', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('contains valid landmark tags, aria-expanded, and aria-controls on toggles', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      // Verify landmark navigation
      const navElement = screen.getByRole('navigation', {
        name: /main navigation/i,
      });
      expect(navElement).toBeInTheDocument();
      expect(navElement).toHaveAttribute('id', 'sidebar-nav');

      // Verify toggle button ARIA attributes
      const collapseToggle = screen.getByRole('button', {
        name: /collapse sidebar navigation/i,
      });
      expect(collapseToggle).toHaveAttribute('aria-expanded', 'true');
      expect(collapseToggle).toHaveAttribute('aria-controls', 'sidebar-nav');

      // Collapse sidebar and verify aria-expanded toggles to false
      fireEvent.click(collapseToggle);
      expect(collapseToggle).toHaveAttribute('aria-expanded', 'false');
      expect(collapseToggle).toHaveAttribute(
        'aria-label',
        'Expand sidebar navigation',
      );
    });

    it('manages accordion submenus with aria-haspopup and aria-expanded', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>,
      );

      // Look for collapsible menu toggle (e.g. Access Control or Collections)
      const menuButtons = screen.getAllByRole('button');
      const collapsibleBtn = menuButtons.find((btn) =>
        btn.hasAttribute('aria-haspopup'),
      );

      if (collapsibleBtn) {
        expect(collapsibleBtn).toHaveAttribute('aria-expanded');
        expect(collapsibleBtn).toHaveAttribute('aria-controls');

        const controlsId = collapsibleBtn.getAttribute('aria-controls');
        // Click to expand
        fireEvent.click(collapsibleBtn);
        expect(collapsibleBtn).toHaveAttribute('aria-expanded', 'true');

        if (controlsId) {
          const region = document.getElementById(controlsId);
          expect(region).toBeInTheDocument();
          expect(region).toHaveAttribute('role', 'region');
        }
      }
    });
  });

  describe('Focus Trap and Focus Restoration (useFocusTrap)', () => {
    it('cycles focus within the container on Tab and Shift+Tab', () => {
      const { rerender } = render(<FocusTrapTestContainer isOpen={false} />);

      const triggerBtn = screen.getByRole('button', {
        name: /trigger button/i,
      });
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open trap dialog
      rerender(<FocusTrapTestContainer isOpen={true} />);

      const firstInput = screen.getByPlaceholderText('First Field');
      const lastBtn = screen.getByRole('button', { name: /last button/i });

      // Tab cycling: pressing Tab on last element cycles to first element
      lastBtn.focus();
      expect(document.activeElement).toBe(lastBtn);

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(firstInput);

      // Shift+Tab cycling: pressing Shift+Tab on first element cycles to last element
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastBtn);
    });

    it('handles Escape key to trigger dismiss callback', () => {
      const handleEscape = vi.fn();
      render(<FocusTrapTestContainer isOpen={true} onEscape={handleEscape} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleEscape).toHaveBeenCalledTimes(1);
    });

    it('restores focus to trigger button upon closing', () => {
      const { rerender } = render(<FocusTrapTestContainer isOpen={false} />);
      const triggerBtn = screen.getByRole('button', {
        name: /trigger button/i,
      });
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open modal
      rerender(<FocusTrapTestContainer isOpen={true} />);
      const firstInput = screen.getByPlaceholderText('First Field');
      firstInput.focus();

      // Close modal
      rerender(<FocusTrapTestContainer isOpen={false} />);
      expect(document.activeElement).toBe(triggerBtn);
    });
  });

  describe('Aria-Live Regions & Announcers', () => {
    it('passes automated axe audit on LiveStatusBanner', async () => {
      const { container } = render(
        <LiveStatusBanner
          message="All changes saved to cloud"
          politeness="polite"
          visible
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces dynamic messages to polite and assertive live regions', async () => {
      render(
        <LiveAnnouncerProvider>
          <LiveAnnouncerTestConsumer />
        </LiveAnnouncerProvider>,
      );

      const politeRegion = screen.getByTestId('live-region-polite');
      const assertiveRegion = screen.getByTestId('live-region-assertive');

      expect(politeRegion).toHaveAttribute('aria-live', 'polite');
      expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
      expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');

      // Trigger polite announcement
      fireEvent.click(
        screen.getByRole('button', { name: /trigger polite announcement/i }),
      );
      await screen.findByText('Page saved to cloud successfully');
      expect(politeRegion.textContent).toBe('Page saved to cloud successfully');

      // Trigger assertive announcement
      fireEvent.click(
        screen.getByRole('button', { name: /trigger assertive alert/i }),
      );
      await screen.findByText('Network connection failed');
      expect(assertiveRegion.textContent).toBe('Network connection failed');
    });
  });

  describe('PageEditorHeader A11y', () => {
    it('passes automated axe audit with zero violations', async () => {
      const { container } = render(
        <PageEditorHeader
          schemaSlug="pages"
          slug="landing-page"
          title="Landing Page"
          onTitleChange={vi.fn()}
          onSlugChange={vi.fn()}
          activeBuilder="grapesjs"
          availableSchemasCount={3}
          onOpenSchemaDrawer={vi.fn()}
          onOpenImportModal={vi.fn()}
          onOpenHistoryDrawer={vi.fn()}
          lastAutoSavedAt={Date.now()}
          isSaving={false}
          isDirty={false}
          onSave={vi.fn()}
          onNavigateBack={vi.fn()}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides status role, aria-live="polite", and accessible label on save status badge', () => {
      const { rerender } = render(
        <PageEditorHeader
          schemaSlug="pages"
          slug="test"
          title="Test Page"
          onTitleChange={vi.fn()}
          onSlugChange={vi.fn()}
          activeBuilder="grapesjs"
          availableSchemasCount={1}
          onOpenSchemaDrawer={vi.fn()}
          onOpenImportModal={vi.fn()}
          onOpenHistoryDrawer={vi.fn()}
          lastAutoSavedAt={null}
          isSaving={true}
          isDirty={false}
          onSave={vi.fn()}
          onNavigateBack={vi.fn()}
        />,
      );

      const badge = screen.getByTestId('save-status-badge');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-live', 'polite');
      expect(badge).toHaveAttribute('aria-atomic', 'true');
      expect(badge).toHaveTextContent(/saving/i);

      // Rerender as saved
      rerender(
        <PageEditorHeader
          schemaSlug="pages"
          slug="test"
          title="Test Page"
          onTitleChange={vi.fn()}
          onSlugChange={vi.fn()}
          activeBuilder="grapesjs"
          availableSchemasCount={1}
          onOpenSchemaDrawer={vi.fn()}
          onOpenImportModal={vi.fn()}
          onOpenHistoryDrawer={vi.fn()}
          lastAutoSavedAt={Date.now()}
          isSaving={false}
          isDirty={false}
          onSave={vi.fn()}
          onNavigateBack={vi.fn()}
        />,
      );

      expect(badge).toHaveTextContent(/saved to cloud/i);
    });
  });

  describe('UI Feedback Primitives A11y (InlineErrorAlert & EmptyStateCard)', () => {
    it('InlineErrorAlert passes automated axe audit', async () => {
      const { container } = render(
        <InlineErrorAlert
          title="Database Connection Timeout"
          message="Could not reach the database replica"
          onRetry={vi.fn()}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('EmptyStateCard passes automated axe audit', async () => {
      const { container } = render(
        <EmptyStateCard
          icon={Files}
          title="No Pages Found"
          description="Create your first content page."
          actionLabel="Create Page"
          onAction={vi.fn()}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
