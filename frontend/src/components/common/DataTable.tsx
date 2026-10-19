import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, SlidersHorizontal, Search } from 'lucide-react';
import { exportTableToCsv } from '../../utils/formatters';
import { tokens } from '../../tokens';

export interface ColumnDef<T> {
  key?: keyof T | string;
  accessorKey?: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  width?: string;
}

export type Column<T> = ColumnDef<T>;

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  exportFilename?: string;
  exportFileName?: string;
  defaultSortKey?: keyof T | string;
  defaultSortOrder?: 'asc' | 'desc';
  actions?: React.ReactNode;
  emptyMessage?: string;
  keyExtractor?: (item: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys,
  exportFilename = 'wastewise_table_export',
  exportFileName,
  defaultSortKey,
  defaultSortOrder = 'asc',
  actions,
  emptyMessage = 'No records found.',
  keyExtractor,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const effectiveExportName = exportFileName || exportFilename;

  // Sorting Handler
  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted Records
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) => {
        if (searchKeys && searchKeys.length > 0) {
          return searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(term));
        }
        return Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(term));
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortOrder === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortOrder, searchKeys]);

  // Handle CSV Export
  const handleExport = () => {
    const csvColumns = columns.map((c) => ({
      key: (c.accessorKey || c.key || '') as keyof T,
      label: c.header,
    }));
    exportTableToCsv(effectiveExportName, processedData, csvColumns);
  };

  const paddingClasses = density === 'compact' ? 'py-2 px-3' : 'py-3 px-3.5';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Title or Search */}
        <div className="flex items-center gap-3 flex-1">
          {title && (
            <div>
              <h3 className="text-sm font-bold text-[#17232E]">{title}</h3>
              {subtitle && <p className="text-xs text-[#647386]">{subtitle}</p>}
            </div>
          )}

          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-[#647386] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg text-[#17232E] placeholder:text-[#647386] focus:outline-none focus:ring-2 focus:ring-[#16865D]"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
        </div>

        {/* Right Actions: Density & Export */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DFE5EC] bg-[#FFFFFF] text-[#17232E] hover:bg-[#F0F3F8] transition-colors shadow-xs"
            title={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} row spacing`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#647386]" />
            <span className="hidden sm:inline capitalize">{density}</span>
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DFE5EC] bg-[#FFFFFF] text-[#16865D] hover:bg-[#E4F7ED] hover:border-[#16865D]/40 transition-colors shadow-xs"
            title="Export currently filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#16865D]" />
            <span>Export CSV</span>
          </button>

          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-[#DFE5EC] rounded-xl max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse" role="table">
          <thead className="bg-[#F0F3F8] text-[#17232E] font-bold sticky top-0 z-10 border-b border-[#DFE5EC] select-none">
            <tr>
              {columns.map((col, idx) => {
                const colKey = (col.accessorKey || col.key || idx) as string;
                const isSorted = sortKey === colKey;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={colKey}
                    scope="col"
                    style={{ width: col.width }}
                    className={`${paddingClasses} ${alignClass} uppercase tracking-wider text-xs font-bold text-[#647386] ${
                      col.className || ''
                    }`}
                  >
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(colKey)}
                        className={`inline-flex items-center gap-1 hover:text-[#17232E] transition-colors focus-visible:ring-1 focus-visible:ring-[#16865D] rounded ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#16865D]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#16865D]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#647386] opacity-60" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#DFE5EC] text-[#17232E] bg-[#FFFFFF]">
            {processedData.length > 0 ? (
              processedData.map((row, idx) => {
                const rowKey = keyExtractor ? keyExtractor(row) : idx;
                return (
                  <tr
                    key={String(rowKey)}
                    className="hover:bg-[#F5F7FA] transition-colors"
                  >
                    {columns.map((col, cIdx) => {
                      const colKey = (col.accessorKey || col.key || cIdx) as string;
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right tabular-nums'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      const cellRenderer = col.cell || col.render;

                      return (
                        <td
                          key={colKey}
                          className={`${paddingClasses} ${alignClass} ${col.className || ''}`}
                        >
                          {cellRenderer ? cellRenderer(row) : String((row as any)[colKey] ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-[#647386] text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-[#647386] px-1">
        <span>
          Showing {processedData.length} of {data.length} records
        </span>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-[#16865D] hover:underline font-semibold"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
