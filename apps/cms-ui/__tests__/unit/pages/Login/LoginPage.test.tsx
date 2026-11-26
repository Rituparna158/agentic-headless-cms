import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/Login/LoginPage';

// Mock LoginForm to isolate page tests
vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Mock</div>,
}));

describe('LoginPage', () => {
  const queryClient = new QueryClient();

  it('renders welcome back heading and login form', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your email to sign in to your account'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
