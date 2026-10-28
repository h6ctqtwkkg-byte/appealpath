// Bundles the Preact app into public/app.js. Pass --watch to rebuild on change.
import * as esbuild from "esbuild";

const options = {
  entryPoints: ["src/client/main.tsx"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  jsx: "automatic",
  jsxImportSource: "preact",
  outfile: "public/app.js",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
