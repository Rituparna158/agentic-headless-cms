import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { DataTable, type Column } from '@/components/ui/DataTable';

interface MockItem {
  id: string;
  title: string;
  status: string;
}

const mockColumns: Column<MockItem>[] = [
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
];

const mockData: MockItem[] = [
  { id: '1', title: 'Post Alpha', status: 'Published' },
  { id: '2', title: 'Post Beta', status: 'Draft' },
];

describe('DataTable and DataTableRow', () => {
  it('renders table headers and rows correctly', async () => {
    const { container } = render(
      <DataTable data={mockData} columns={mockColumns} />,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Post Alpha')).toBeInTheDocument();
    expect(screen.getByText('Post Beta')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports click and keyboard navigation on clickable rows', async () => {
    const handleRowClick = vi.fn();
    const { container } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
      />,
    );

    const firstRow = screen.getByRole('button', {
      name: 'Post Alpha',
    });
    expect(firstRow).toBeInTheDocument();
    expect(firstRow).toHaveAttribute('tabIndex', '0');

    // Click trigger
    fireEvent.click(firstRow);
    expect(handleRowClick).toHaveBeenCalledWith('1');

    // Enter key trigger
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    expect(handleRowClick).toHaveBeenCalledWith('1');

    // Space key trigger
    fireEvent.keyDown(firstRow, { key: ' ' });
    expect(handleRowClick).toHaveBeenCalledWith('1');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state when data is empty', async () => {
    const { container } = render(
      <DataTable
        data={[]}
        columns={mockColumns}
        emptyState={<p>No entries found.</p>}
      />,
    );

    expect(screen.getByText('No entries found.')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
