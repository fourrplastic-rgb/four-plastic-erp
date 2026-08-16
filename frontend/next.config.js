/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  
  // Keep your webpack config
  webpack: (config, { isServer }) => {
    return config
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
}

module.exports = nextConfig
