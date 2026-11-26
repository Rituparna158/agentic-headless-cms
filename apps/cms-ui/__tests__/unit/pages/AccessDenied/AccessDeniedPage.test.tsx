import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AccessDeniedPage } from '@/pages/AccessDenied/AccessDeniedPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [
      new URLSearchParams('message=Custom%20access%20denied%20reason'),
    ],
  };
});

const mockLogout = vi.fn((_args, { onSettled }) => onSettled?.());
vi.mock('@/features/auth/hooks/useAuthMutations', () => ({
  useLogoutMutation: () => ({
    mutate: mockLogout,
    isPending: false,
  }),
}));

describe('AccessDeniedPage', () => {
  it('renders access denied title, custom message, and triggers return to login', async () => {
    const { container } = render(
      <BrowserRouter>
        <AccessDeniedPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Custom access denied reason')).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', {
      name: /return to login/i,
    });
    expect(returnBtn).toBeInTheDocument();

    fireEvent.click(returnBtn);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
