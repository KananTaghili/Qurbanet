/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Don't cache HTML pages in the browser — static assets (/_next/static/) are
  // content-hashed so they can stay cached indefinitely.
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

  // App Router client-side Router Cache: don't reuse stale dynamic-page data
  experimental: {
    staleTimes: {
      dynamic: 0,   // always refetch when navigating to a dynamic route
      static: 180,  // static pages can stay cached for 3 min
    },
  },
};

module.exports = nextConfig;
