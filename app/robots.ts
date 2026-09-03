import type { MetadataRoute } from 'next';

// Confidential throughout: a named client shortlist and real candidate
// résumés. Nothing here belongs in a search index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
