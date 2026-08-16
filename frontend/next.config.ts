import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*' // Proxy to Backend
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5001/uploads/:path*' // Proxy to Backend uploads
      }
    ]
  }
};

export default nextConfig;
