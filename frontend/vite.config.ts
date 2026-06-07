// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Required for Vercel: Lovable config skips Nitro unless explicitly enabled.
  nitro: {
    preset: process.env.NITRO_PRESET ?? "vercel",
    output: {
      // Single output dir: client assets + serverless function + config.json (Vercel Build Output API v3).
      dir: "dist",
      serverDir: "dist/functions/__server.func",
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Keep one stable CSS filename so SSR HTML and client assets always match on Vercel.
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "assets/styles[extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
    server: {
      port: 8080,
      strictPort: false,
      host: true,
      allowedHosts: [".ngrok-free.app", ".ngrok.io", ".ngrok.app", "localhost"],
    },
  },
});
