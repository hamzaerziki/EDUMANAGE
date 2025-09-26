import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Excel-safe CSV downloader: adds UTF-8 BOM and uses ';' for FR/AR locales
export function downloadCSV(rows: (string | number)[][], filename: string, language: string, separator?: string) {
  try {
    const sep = separator ?? ((language === 'fr' || language === 'ar') ? ';' : ',');
    const escapeCell = (val: any) => {
      const s = String(val ?? '');
      const needsQuote = s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(sep) || /^\s|\s$/.test(s);
      const esc = s.replace(/"/g, '""');
      return needsQuote ? `"${esc}"` : esc;
    };
    const content = rows.map(r => r.map(escapeCell).join(sep)).join('\r\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error('downloadCSV failed', e);
  }
}
