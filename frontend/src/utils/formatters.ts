/**
 * WasteWise AI — Operational Data & Currency Formatters
 * 
 * Standardizes Indian Rupee formatting (en-IN), tabular numbers,
 * percentage values, and client-side CSV table export.
 */

/**
 * Formats a number into Indian Rupee format (en-IN).
 * Example: 48324 -> "₹48,324" | 184500 -> "₹1,84,500"
 */
export function formatINR(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '₹0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a plain numerical value with en-IN comma separation.
 */
export function formatNumber(val: number | string | undefined | null, decimals = 0): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a percentage value.
 */
export function formatPercent(val: number | undefined | null, decimals = 1): string {
  if (val === undefined || val === null) return '0.0%';
  return `${val.toFixed(decimals)}%`;
}

/**
 * Triggers a client-side download of tabular records as a standard CSV.
 */
export function exportTableToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T; label: string }[]
): void {
  if (!rows || rows.length === 0) return;

  const headerRow = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const strVal = val === undefined || val === null ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
