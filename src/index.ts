export interface CsvOptions {
  /** Delimiter. If omitted, we'll auto-detect among , ; \t | */
  delimiter?: string;
  /** Use first row as headers (default true). You can also pass explicit headers. */
  headers?: boolean | string[];
  /** Keep header case (default: false = trim + toLowerCase) */
  preserveHeaderCase?: boolean;
  /** Treat lines starting with this as comments (e.g. '#') */
  comment?: string;
  /** Skip empty lines (default true) */
  skipEmptyLines?: boolean;
  /** Fill missing cells with this value (default null) */
  defval?: unknown;
  /** Try to coerce numbers/booleans/null (default false) */
  inferTypes?: boolean;
  /** Trim cells (default true) */
  trimCells?: boolean;
}

export type CsvRow = Record<string, unknown>;

export async function parseCSV(
  input: File | Blob | ArrayBuffer | Buffer | string,
  opts: CsvOptions = {}
): Promise<CsvRow[]> {
  const {
    headers: headersOption = true,
    preserveHeaderCase = false,
    comment,
    skipEmptyLines = true,
    defval = null,
    inferTypes = false,
    trimCells = true,
  } = opts;

  const text = await toText(input);
  const cleaned = stripBOM(text);
  const delimiter = opts.delimiter ?? detectDelimiter(cleaned);
  const rows = parseRows(cleaned, delimiter, {
    comment,
    skipEmptyLines: opts.skipEmptyLines ?? true,
  });

  if (!rows.length) return [];

  let headerNames: string[];
  let dataStart = 0;

  if (Array.isArray(headersOption)) {
    headerNames = normalizeHeaders(headersOption, preserveHeaderCase);
    dataStart = 1; // <-- change this from 0 to 1 to drop the first CSV line
  } else if (headersOption === false) {
    headerNames = rows[0].map((_, i) => `c${i}`);
  } else {
    headerNames = normalizeHeaders(rows[0], preserveHeaderCase);
    dataStart = 1;
  }

  const width = Math.max(headerNames.length, widestRow(rows));
  if (headerNames.length < width) {
    for (let i = headerNames.length; i < width; i++) headerNames.push(`c${i}`);
  }

  const out: CsvRow[] = [];
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const csvRow: CsvRow = {};
    for (let c = 0; c < width; c++) {
      const key = headerNames[c];
      let cell = row[c];
      if (typeof cell === "string" && trimCells) cell = cell.trim();
      csvRow[key] = inferTypes ? convertToJsTypes(cell) : cell ?? defval;
    }
    out.push(csvRow);
  }
  return out;
}

async function toText(
  input: File | Blob | ArrayBuffer | Buffer | string
): Promise<string> {
  if (typeof input === "string") return input;

  if (typeof (input as Blob).text === "function") {
    return (input as Blob).text();
  }

  if (input instanceof ArrayBuffer) {
    return new TextDecoder("utf-8").decode(new Uint8Array(input));
  }

  // Node Buffer
  // @ts-ignore - Buffer exists in Node
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    const buf = input as unknown as Buffer;
    return buf.toString("utf8");
  }

  throw new Error(
    "Unsupported input type. Provide a string, File, Blob, ArrayBuffer, or Buffer."
  );
}

function stripBOM(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function detectDelimiter(s: string): string {
  const candidates = [",", ";", "\t", "|"];
  const sample = s.split(/\r?\n/, 5).filter(Boolean);

  let best = ",";
  let maxColumns = 1;

  for (const d of candidates) {
    const cols = sample.map((line) => line.split(d).length);
    const avg = cols.reduce((a, b) => a + b, 0) / cols.length;

    if (avg > maxColumns) {
      maxColumns = avg;
      best = d;
    }
  }

  return best;
}

function normalizeHeaders(headers: string[], preserve?: boolean): string[] {
  return headers.map((h) => {
    const v = (h ?? "").trim().replace(/^\uFEFF/, "");
    return preserve ? v : v.toLowerCase();
  });
}

function convertToJsTypes(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s === "") return "";
  if (/^(true|false)$/i.test(s)) return /^true$/i.test(s);
  if (/^null$/i.test(s)) return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
    const n = Number(s);
    if (!Number.isNaN(n)) return n;
  }
  return s;
}

function parseRows(
  text: string,
  delimiter: string,
  opts: { comment?: string; skipEmptyLines: boolean }
): string[][] {
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (!(opts.skipEmptyLines && row.length === 1 && row[0].trim() === "")) {
      lines.push(row);
    }
    row = [];
  };

  const d = delimiter;
  const comment = opts.comment;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const next = i + 1 < len ? text[i + 1] : "";

    // start-of-line comment
    if (
      !inQuotes &&
      field === "" &&
      row.length === 0 &&
      comment &&
      ch === comment
    ) {
      while (i < len && text[i] !== "\n") i++;
      continue;
    }

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === d) {
      pushField();
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // handle CRLF
      if (ch === "\r" && next === "\n") i++;
      pushField();
      pushRow();
      continue;
    }

    field += ch;
  }

  pushField();
  if (row.length > 1 || row[0] !== "") pushRow();
  return lines;
}

function widestRow(rows: string[][]): number {
  let w = 0;
  for (let i = 0; i < rows.length; i++)
    if (rows[i].length > w) w = rows[i].length;
  return w;
}

export default parseCSV;
