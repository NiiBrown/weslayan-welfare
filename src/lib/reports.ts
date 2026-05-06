// Report generation utilities
// Used by both API routes and client-side downloads

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  columns: { key: string; label: string; width?: number }[];
  rows: Record<string, any>[];
  summary?: Record<string, string | number>[];
}

// Generate CSV string from report data
export function generateCsv(data: ReportData): string {
  const headers = data.columns.map((c) => c.label).join(",");
  const rows = data.rows
    .map((row) =>
      data.columns
        .map((col) => {
          const val = row[col.key];
          // Escape commas and quotes
          const str = String(val ?? "");
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    )
    .join("\n");

  return `${data.title}\nGenerated: ${data.generatedAt}\n\n${headers}\n${rows}`;
}

// Client-side download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(data: ReportData, filename: string) {
  const csv = generateCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}
