# csv-to-array-browser

Parse **CSV** files into JavaScript objects — in the **browser** and **Node.js** — with zero dependencies.

- ✅ Works with `File`, `Blob`, `ArrayBuffer`, `Buffer`, or plain string
- ✅ Handles quotes (`"a, b"`), escaped quotes (`""`), CR/LF line endings
- ✅ Auto-detects common delimiters (`,`, `;`, `\t`, `|`) or you can set one
- ✅ Optional type coercion (`"42"` → `42`, `"true"` → `true`, `"null"` → `null`)
- ✅ Strips UTF-8 BOM so your first header isn’t corrupted
- ✅ Tiny surface area, TypeScript-ready

---

## 📦 Installation

```bash
npm i csv-to-array-browser
```

## 🚀 Usage

### Browser (with file input)

```ts
import { parseCSV } from "csv-to-array-browser";

document.querySelector("#file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const rows = await parseCSV(file, { sheet: undefined }); // sheet is ignored; CSV options shown below
  console.log(rows);
});

<input id="file" type="file" accept=".csv" />;
```

### Node.js (with Buffer/ArrayBuffer)

```ts
import { readFileSync } from "node:fs";
import { parseCSV } from "csv-to-array-browser";

const buf = readFileSync("./example.csv"); // Buffer
const rows = await parseCSV(buf, { inferTypes: true });

console.log(rows);
```

## 📖 API

`parseWorkbook(input, options?)`

- `input`

  `File` | `Blob` | `ArrayBuffer` | `Buffer`

  (Works with browser files, Node Buffers, or raw ArrayBuffers)

- `options` (optional)

| Option               | Type                 | Default    | Description                                                                 |
|----------------------|----------------------|------------|-----------------------------------------------------------------------------|
| `delimiter`          | `string`             | auto       | Field delimiter. If omitted, tries `, ; \t |` and picks the best fit.       |
| `headers`            | `boolean \| string[]`| `true`     | Header handling. `true`: first row is headers. `false`: synthesize headers (`c0`, `c1`, …). `string[]`: use these headers **and skip the first CSV row**. |
| `preserveHeaderCase` | `boolean`            | `false`    | When `false`, headers are trimmed + lowercased. When `true`, keep original casing. |
| `comment`            | `string`             | `undefined`| Lines starting with this (e.g. `"#"`) are skipped.                          |
| `skipEmptyLines`     | `boolean`            | `true`     | Drop empty rows.                                                            |
| `defval`             | `unknown`            | `null`     | Value to use when a row has fewer cells than headers.                       |
| `inferTypes`         | `boolean`            | `false`    | Coerce `"true"/"false" → boolean`, `"null" → null`, number-like strings → numbers; otherwise leave as strings. |
| `trimCells`         | `boolean`            | `true`    | Trims cells when `true` |

**The parser automatically strips a UTF-8 BOM at the start of the file.**

## Examples

### 1) Basic CSV

```ts
const csv = `name,age,city
Alice,30,Paris
Bob,28,Berlin`;

await parseCSV(csv);
// [
//   { name: "Alice", age: "30", city: "Paris" },
//   { name: "Bob",   age: "28",  city: "Berlin" }
// ]
```

### 2) With type coercion

```ts
const csv = `name,age,active
Alice,30,true
Bob,28,false`;

await parseCSV(csv, { inferTypes: true });
// [
//   { name: "Alice", age: 30, active: true },
//   { name: "Bob",   age: 28, active: false }
// ]
```

### 3) Custom delimiter (semicolon)

```ts
const csv = `name;age;city
Alice;30;Paris`;

await parseCSV(csv, { delimiter: ";" });
// [{ name: "Alice", age: "30", city: "Paris" }]
```

### 4) Custom headers (replace the file’s header row)

```ts
const csv = `a,b
1,2`;

await parseCSV(csv, { headers: ["X", "Y"] });
// [{ x: "1", y: "2" }]
```

### 5) No headers (synthesize c0, c1, …)

```ts
const csv = `a,b
1,2`;

await parseCSV(csv, { headers: false });
// [
//   { c0: "a", c1: "b" },
//   { c0: "1", c1: "2" }
// ]
```

### 6) Quoted fields + escaped quotes

```ts
const csv = `name,quote
"Alice, Jr.","She said ""Hi"""`;

await parseCSV(csv);
// [{ name: "Alice, Jr.", quote: 'She said "Hi"' }]
```

### 7) Comments & CRLF

```ts
const csv = `# header
name,age\r\nAlice,30\r\nBob,28\r\n`;

await parseCSV(csv, { comment: "#" });
// [
//   { name: "Alice", age: "30" },
//   { name: "Bob", age: "28" }
// ]
```

### 8) Trim cells

```ts
const csv = `# header
name,age\r\n Alice ,30\r\nBob,28\r\n`;

await parseCSV(csv, { trimCells: "false" });
// [
//   { name: " Alice ", age: "30" },
//   { name: "Bob", age: "28" }
// ]
```

## FAQ

### Q: How big a CSV can it handle?

For typical UX (uploads < ~10–20 MB) it’s great. For very large files or progressive processing, consider a streaming approach (Node: csv-parse; browser: Web Streams + Worker).

### Q: How does auto delimiter detection work?

It samples the first lines and tries common delimiters (, ; \t |), picking the one that yields the most consistent, widest table.

### Q: Does it parse dates?

Not automatically. You can enable inferTypes for booleans/numbers/nulls and then post-process date fields as needed.

## 🛠 Development

### Clone the repo and run:

```bash
npm install
npm run build
npm test

npm run build → Build dist files

npm test → Run unit tests (Vitest)

npm run pack:check → Preview files that will publish
```
