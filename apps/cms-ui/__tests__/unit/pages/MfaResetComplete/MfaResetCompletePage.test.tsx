import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { MfaResetCompletePage } from '../../../../src/pages/MfaResetComplete/MfaResetCompletePage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/mfa-reset-complete']}>
      <Routes>
        <Route path="/mfa-reset-complete" element={<MfaResetCompletePage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('MfaResetCompletePage', () => {
  it('renders the MFA reset successful message', () => {
    renderPage();
    expect(screen.getByText('MFA Reset Successful')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your multi-factor authentication has been successfully disabled by an administrator. You can now log in using just your password.',
      ),
    ).toBeInTheDocument();
  });

  it('contains a link to the login page', () => {
    renderPage();
    const loginLink = screen.getByRole('link', { name: /Sign In Now/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
