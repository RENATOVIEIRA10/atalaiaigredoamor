import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Unique build ID for cache busting
const BUILD_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Generate /version.json at build time
    {
      name: "version-json",
      generateBundle(_: any, bundle: any) {
        bundle["version.json"] = {
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ version: BUILD_ID, timestamp: new Date().toISOString() }),
          name: "version.json",
          needsCodeReference: false,
        };
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "placeholder.svg"],
      workbox: {
        // Cache only static assets – never cache API / dynamic data
        globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2,ttf,eot}"],
        // NEVER cache index.html or version.json — always network first
        globIgnores: ["version.json", "**/index.html"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Never cache OAuth redirects or Supabase / API calls
        navigateFallbackDenylist: [/^\/~oauth/, /^\/rest/, /^\/auth/, /^\/version\.json/],
        // Serve index.html for all navigation requests (SPA fallback)
        navigateFallback: 'index.html',
        // Clean old caches on new SW activation
        cleanupOutdatedCaches: true,
        // Force immediate activation of new SW
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // version.json – always network only
            urlPattern: /\/version\.json/,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "Rede Amor a 2",
        short_name: "Amor a 2",
        description: "Sistema de gestão pastoral – Rede Amor a 2",
        theme_color: "#1A2F4B",
        background_color: "#1A2F4B",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
