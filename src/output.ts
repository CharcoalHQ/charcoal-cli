export function outputTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );

  const line = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join('  ');

  console.log(line(headers));
  console.log(widths.map((w) => '─'.repeat(w)).join('  '));
  for (const row of rows) {
    console.log(line(row));
  }
}

export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function outputError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
