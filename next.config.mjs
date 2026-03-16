/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/tv/:path*',
        destination: 'https://tradingverse.in/:path*',
      },
    ];
  },
};

export default nextConfig;
