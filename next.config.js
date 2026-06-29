/** @type {import('next').NextConfig} */

// Capacitor (APK) üçün static export rejimi: BUILD_TARGET=capacitor olduqda.
// Web (dev/prod server) build-i toxunulmaz qalır.
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const nextConfig = {
  images: {
    // Static export-da next/image optimizasiyası işləmir → unoptimized
    unoptimized: isCapacitor,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Capacitor rejimində static export
  ...(isCapacitor
    ? { output: "export", trailingSlash: true }
    : {
        // redirects/headers yalnız web (server) rejimində — export onları dəstəkləmir
        async redirects() {
          return [
            { source: "/login",        destination: "/auth/login",    permanent: true },
            { source: "/register",     destination: "/auth/register", permanent: true },
            { source: "/haqqimizda",   destination: "/about",         permanent: true },
            { source: "/xidmetler",    destination: "/services",      permanent: true },
            { source: "/nece-isleyir", destination: "/process",       permanent: true },
            { source: "/elaqe",        destination: "/contact",       permanent: true },
          ];
        },
        async headers() {
          return [
            {
              source: '/((?!_next/static|_next/image|favicon\\.ico).*)',
              headers: [
                { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                { key: 'Pragma',        value: 'no-cache' },
                { key: 'Expires',       value: '0' },
              ],
            },
          ];
        },
      }),

  // App Router client-side Router Cache: don't reuse stale dynamic-page data
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },

  outputFileTracingExcludes: {
    "*": ["**/_not-found/**"],
  },
};

module.exports = nextConfig;
