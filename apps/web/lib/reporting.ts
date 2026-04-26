export function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function normalizeDate(value: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

export function readDateRange(url: string) {
  const searchParams = new URL(url).searchParams;
  return {
    from: normalizeDate(searchParams.get("from")),
    to: normalizeDate(searchParams.get("to"))
  };
}

export function isWithinDateRange(date: string, from?: string, to?: string) {
  const normalized = normalizeDate(date);
  if (!normalized) {
    return false;
  }
  if (from && normalized < from) {
    return false;
  }
  if (to && normalized > to) {
    return false;
  }
  return true;
}

export function csvDownloadResponse(filename: string, header: Array<string | number>, rows: Array<Array<string | number>>) {
  const body = [header.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
