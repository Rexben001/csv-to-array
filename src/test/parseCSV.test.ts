import { describe, expect, test } from "vitest";
import { parseCSV } from "../index";

const enc = new TextEncoder();

describe("parseCSV", () => {
  test("parses simple CSV (comma) with default options", async () => {
    const csv = `name,age,city
Alice,30,Paris
Bob,28,Berlin`;
    const rows = await parseCSV(csv);
    expect(rows).toEqual([
      { name: "Alice", age: "30", city: "Paris" },
      { name: "Bob", age: "28", city: "Berlin" },
    ]);
  });

  test("auto-detects semicolon delimiter", async () => {
    const csv = `name;age;city
Alice;30;Paris
Bob;28;Berlin`;
    const rows = await parseCSV(csv); // no delimiter passed
    expect(rows[0]).toEqual({ name: "Alice", age: "30", city: "Paris" });
  });

  test("respects custom delimiter (tab)", async () => {
    const csv = `name\tage\tcity
Alice\t30\tParis`;
    const rows = await parseCSV(csv, { delimiter: "\t" });
    expect(rows[0]).toEqual({ name: "Alice", age: "30", city: "Paris" });
  });

  test("handles quoted fields and escaped quotes", async () => {
    const csv = `name,quote
"Alice, Jr.","She said ""Hi"""`;
    const rows = await parseCSV(csv);
    expect(rows[0]).toEqual({
      name: "Alice, Jr.",
      quote: 'She said "Hi"',
    });
  });

  test("handles CRLF line endings", async () => {
    const csv = `name,age\r\nAlice,30\r\nBob,28\r\n`;
    const rows = await parseCSV(csv);
    expect(rows.length).toBe(2);
    expect(rows[1]).toEqual({ name: "Bob", age: "28" });
  });

  test("skips empty lines by default", async () => {
    const csv = `name,age

Alice,30

Bob,28
`;
    const rows = await parseCSV(csv);
    expect(rows.length).toBe(2);
  });

  test("supports comment lines", async () => {
    const csv = `# header comment
name,age
Alice,30
# another comment
Bob,28`;
    const rows = await parseCSV(csv, { comment: "#" });
    expect(rows.map((r) => r.name)).toEqual(["Alice", "Bob"]);
  });

  test("strips UTF-8 BOM at start", async () => {
    const csv = "\uFEFFname,age\nAlice,30";
    const rows = await parseCSV(csv);
    expect(Object.keys(rows[0])).toEqual(["name", "age"]);
  });

  test("headers=false: synthesizes c0,c1,... and keeps first row as data", async () => {
    const csv = `name,age
Alice,30`;
    const rows = await parseCSV(csv, { headers: false });
    // First row becomes data with synthetic headers
    expect(rows[0]).toEqual({ c0: "name", c1: "age" });
    expect(rows[1]).toEqual({ c0: "Alice", c1: "30" });
  });

  test("custom headers array", async () => {
    const csv = `a,b\n1,2`;
    const rows = await parseCSV(csv, { headers: ["X", "Y"] });
    expect(rows).toEqual([{ x: "1", y: "2" }]); // lowercased by default
  });

  test("preserveHeaderCase keeps header casing", async () => {
    const csv = `First Name,Age\nAlice,30`;
    const rows = await parseCSV(csv, { preserveHeaderCase: true });
    expect(rows[0]).toEqual({ "First Name": "Alice", Age: "30" });
  });

  test("inferTypes converts booleans, nulls and numbers", async () => {
    const csv = `a,b,c,d
true,null,42,3.14`;
    const rows = await parseCSV(csv, { inferTypes: true });
    expect(rows[0]).toEqual({ a: true, b: null, c: 42, d: 3.14 });
  });

  test("defval fills missing cells", async () => {
    const csv = `a,b,c
1,2
3,4,5`;
    const rows = await parseCSV(csv, { defval: "-" });
    expect(rows[0]).toEqual({ a: "1", b: "2", c: "-" });
    expect(rows[1]).toEqual({ a: "3", b: "4", c: "5" });
  });

  test("accepts ArrayBuffer input", async () => {
    const csv = `name,age\nAlice,30`;
    const ab = enc.encode(csv).buffer;
    const rows = await parseCSV(ab);
    expect(rows[0]).toEqual({ name: "Alice", age: "30" });
  });

  test("trims cells by default", async () => {
    const csv = `name , age \n Alice , 30 \n Bob , 28 `;
    const rows = await parseCSV(csv);
    expect(rows[0]).toEqual({ name: "Alice", age: "30" });
    expect(rows[1]).toEqual({ name: "Bob", age: "28" });
  });

  test("trimCells=false preserves whitespace in cells", async () => {
    const csv = `name , age \n Alice , 30 \n Bob , 28 `;
    const rows = await parseCSV(csv, { trimCells: false });
    expect(rows[0]).toEqual({ name: " Alice ", age: " 30 " });
    expect(rows[1]).toEqual({ name: " Bob ", age: " 28 " });
  });

  test.runIf(typeof Buffer !== "undefined")(
    "accepts Node Buffer input (if available)",
    async () => {
      const buf = Buffer.from("name,age\nBob,28", "utf8");
      const rows = await parseCSV(buf);
      expect(rows[0]).toEqual({ name: "Bob", age: "28" });
    }
  );

  test.runIf(typeof Blob !== "undefined")("supports Blob input", async () => {
    const blob = new Blob([`name,age\nAlice,30`], { type: "text/csv" });
    const rows = await parseCSV(blob);
    expect(rows[0]).toEqual({ name: "Alice", age: "30" });
  });

  test("throws for unsupported input types", async () => {
    // @ts-expect-error intentional wrong type
    await expect(parseCSV(123)).rejects.toThrow(/Unsupported input type/i);
  });

  test("handles quoted delimiter at end of line", async () => {
    const csv = `a,b\n"ends with quote,","x"`;
    const rows = await parseCSV(csv);
    expect(rows[0]).toEqual({ a: "ends with quote,", b: "x" });
  });
});
