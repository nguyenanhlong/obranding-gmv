import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // ESLint chạy riêng trong CI (npm run lint) để log rõ ràng hơn
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
