/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The résumés live outside /public now, so Next's tracing cannot infer them
  // from an import — they are read by filename at request time. Ship them with
  // the route that serves them, or it 404s in production and works locally.
  experimental: {
    outputFileTracingIncludes: {
      '/api/resume/[file]': ['./private/resumes/**'],
    },
  },
  async headers() {
    return [
      {
        // Everything here is confidential: a client shortlist and real
        // candidate résumés. None of it should ever reach a search index or
        // sit in a shared cache, and the résumés should not be framed by
        // another site. This does not replace access control — it stops the
        // quiet leak where a link gets crawled and the candidates become
        // findable by name on Google.
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/resumes/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
