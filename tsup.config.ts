import { defineConfig } from "tsup";

export default defineConfig([
  // ESM + CJS (for bundlers and Node)
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node16",
    treeshake: true,
    splitting: false,
  },
  // IIFE (single file) for <script src="..."> via CDN
  {
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "ParseWorkbook", // window.ParseWorkbook
    outDir: "dist/global",
    sourcemap: true,
    minify: true,
  },
]);
