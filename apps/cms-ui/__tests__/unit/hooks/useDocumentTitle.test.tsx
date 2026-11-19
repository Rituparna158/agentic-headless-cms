import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import {
  resolveDocumentTitle,
  useDocumentTitle,
} from '../../../src/hooks/useDocumentTitle';

describe('resolveDocumentTitle', () => {
  it('maps known routes', () => {
    expect(resolveDocumentTitle('/login')).toBe('Sign in · Agentic CMS');
  });
  it('prefers the longest matching prefix', () => {
    expect(resolveDocumentTitle('/users/roles')).toBe('Roles · Agentic CMS');
    expect(resolveDocumentTitle('/users/other')).toBe(
      'Users & access · Agentic CMS',
    );
  });
  it('does not match partial segments', () => {
    expect(resolveDocumentTitle('/loginx')).toBe('Agentic CMS');
  });
  it('falls back to the app title', () => {
    expect(resolveDocumentTitle('/')).toBe('Agentic CMS');
  });
});

describe('useDocumentTitle', () => {
  it('sets document.title from the route', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/media']}>{children}</MemoryRouter>
    );
    renderHook(() => useDocumentTitle(), { wrapper });
    expect(document.title).toBe('Media library · Agentic CMS');
  });
});
