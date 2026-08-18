import { type ReactNode, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Icon } from './Icon';
import { Select } from './Select';
import { EmptyState } from './Feedback';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortAccessor?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | null;
  searchPlaceholder?: string;
  searchAccessor?: (row: T) => string;
  statusOptions?: { value: string; label: string }[];
  statusAccessor?: (row: T) => string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  selectedRowId,
  searchPlaceholder = 'Search…',
  searchAccessor,
  statusOptions,
  statusAccessor,
  pageSize = 10,
  emptyTitle = 'No records',
  emptyDescription,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter && statusAccessor) {
      result = result.filter((r) => statusAccessor(r) === statusFilter);
    }
    if (search.trim() && searchAccessor) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => searchAccessor(r).toLowerCase().includes(q));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortAccessor) {
        result = [...result].sort((a, b) => {
          const av = col.sortAccessor!(a);
          const bv = col.sortAccessor!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [rows, search, statusFilter, sortKey, sortDir, columns, searchAccessor, statusAccessor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  return (
    <div>
      {(searchAccessor || statusOptions) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-3">
          {searchAccessor && (
            <div className="relative flex-1 min-w-[180px]">
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-ink-200 py-1.5 pl-8 pr-3 text-sm focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/40"
              />
            </div>
          )}
          {statusOptions && (
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto py-1.5 text-sm"
            >
              <option value="">All statuses</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          )}
          <span className="ml-auto text-xs text-ink-400">
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={clsx(
                        'px-5 py-3',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.sortAccessor && 'cursor-pointer select-none hover:text-ink-600',
                        col.headerClassName,
                      )}
                      onClick={() => col.sortAccessor && toggleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortAccessor && sortKey === col.key && (
                          <Icon name="chevronDown" className={clsx('h-3 w-3 transition-transform', sortDir === 'desc' && 'rotate-180')} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pageRows.map((row) => {
                  const id = getRowId(row);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(row)}
                      className={clsx(onRowClick && 'cursor-pointer hover:bg-ink-50', selectedRowId === id && 'bg-crimson-50/60')}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={clsx(
                            'px-5 py-3',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            col.cellClassName,
                          )}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm text-ink-500">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
