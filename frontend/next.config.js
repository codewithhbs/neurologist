/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async rewrites() {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || 'https://api.drneerajkumarneurologist.com/api';
    const apiUrl = rawApi.replace(/\/+$/, '');
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
