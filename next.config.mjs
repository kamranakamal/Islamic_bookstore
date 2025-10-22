const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = null;
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;
} catch (error) {
  supabaseHostname = null;
}

const headers = async () => [
  {
    source: "/api/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "private, no-store, max-age=0",
      },
    ],
  },
  {
    source: "/admin/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "private, no-store, max-age=0",
      },
    ],
  },
  {
    source: "/:all*\\.(?:jpg|jpeg|png|gif|webp|svg|ico)",
    headers: [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
  },
  {
    source: "/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "public, max-age=600, stale-while-revalidate=86400",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "fullscreen=(), geolocation=(), camera=(), microphone=()",
      },
    ],
  },
];

const nextConfig = {
  experimental: {
    optimizeCss: true
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**"
          }
        ]
      : []
  },
  headers
};

export default nextConfig;
