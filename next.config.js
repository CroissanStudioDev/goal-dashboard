/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
