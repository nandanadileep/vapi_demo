/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Embedded / preview browsers (e.g. Cursor) often cache HTML that references
   * old `/_next/static/*` chunk hashes after a dev restart or `.next` wipe, then
   * `main-app.js`, `app-pages-internals.js`, and `layout.css` 404 or error.
   * Disable caching in development so the document and assets stay in sync.
   */
  async headers() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
