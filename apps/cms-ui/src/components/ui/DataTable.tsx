import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableRowProps<T extends { id: string }> {
  row: T;
  columns: Column<T>[];
  onRowClick?: (id: string) => void;
  getRowLabel?: (row: T) => string;
}

/**
 * Memoized row component preventing expensive re-renders on large tables.
 * Fully keyboard-accessible complying with WCAG 2.1 AA.
 */
export const DataTableRow = React.memo(function DataTableRow<
  T extends { id: string; title?: string; name?: string },
>({ row, columns, onRowClick, getRowLabel }: DataTableRowProps<T>) {
  const isClickable = !!onRowClick;
  const label =
    getRowLabel?.(row) || row.title || row.name || `Open details for ${row.id}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row.id);
    }
  };

  return (
    <tr
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? label : undefined}
      onClick={isClickable ? () => onRowClick(row.id) : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={`border-b border-border/60 transition-colors hover:bg-muted/40 ${
        isClickable
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10'
          : ''
      }`}
    >
      {columns.map((col) => (
        <td
          key={col.key}
          className={`px-4 py-3 text-sm text-foreground align-middle ${col.className ?? ''}`}
        >
          {col.render
            ? col.render(row)
            : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
        </td>
      ))}
    </tr>
  );
}) as <T extends { id: string }>(
  props: DataTableRowProps<T>,
) => React.ReactElement;

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (id: string) => void;
  getRowLabel?: (row: T) => string;
  emptyState?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * Shared accessible data table primitive with memoized rows and full keyboard navigation.
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  getRowLabel,
  emptyState,
  ariaLabel = 'Data table',
  className = '',
}: DataTableProps<T>): React.ReactElement {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm ${className}`}
    >
      <table
        className="w-full text-left border-collapse"
        aria-label={ariaLabel}
      >
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                  col.className ?? ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {data.map((row) => (
            <DataTableRow
              key={row.id}
              row={row}
              columns={columns}
              onRowClick={onRowClick}
              getRowLabel={getRowLabel}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
