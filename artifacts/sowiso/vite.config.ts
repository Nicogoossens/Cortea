import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const resolvedPort = Number.isNaN(port) || port <= 0 ? 3000 : port;

const basePath = process.env.BASE_PATH ?? "/";

function syncLocales(): Plugin {
  const srcDir = path.resolve(import.meta.dirname, "src/locales");
  const destDir = path.resolve(import.meta.dirname, "public/locales");

  function copyDir(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  function syncFile(file: string) {
    const rel = path.relative(srcDir, file);
    const dest = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }

  function removeFile(file: string) {
    const rel = path.relative(srcDir, file);
    const dest = path.join(destDir, rel);
    try { fs.rmSync(dest, { recursive: true }); } catch { /* already gone */ }
  }

  return {
    name: "sync-locales",
    buildStart() {
      if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
      copyDir(srcDir, destDir);
    },
    configureServer(server) {
      if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
      copyDir(srcDir, destDir);
      server.watcher.add(srcDir);
      server.watcher.on("change", syncFile);
      server.watcher.on("add", syncFile);
      server.watcher.on("unlink", removeFile);
      server.watcher.on("unlinkDir", removeFile);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    syncLocales(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: resolvedPort,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: resolvedPort,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
