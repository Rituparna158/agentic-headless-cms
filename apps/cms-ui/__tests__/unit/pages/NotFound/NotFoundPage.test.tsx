import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { NotFoundPage } from '../../../../src/pages/NotFound/NotFoundPage';

const renderPage = (initialEntries = ['/unknown-page']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>Dashboard Home</div>} />
        <Route path="/dashboard-x" element={<div>Dashboard X</div>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('NotFoundPage', () => {
  it('renders the 404 heading and message', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('navigates to the dashboard on button click', () => {
    renderPage();
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
  });

  it('navigates back on Go Back click', () => {
    renderPage(['/dashboard-x', '/unknown-page']);
    expect(screen.getByText('404')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Go Back'));
    expect(screen.getByText('Dashboard X')).toBeInTheDocument();
  });
});
