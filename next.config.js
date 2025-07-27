/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false, // Using pages directory
  },
  env: {
    NEXT_PUBLIC_AZURE_ENDPOINT: process.env.NEXT_PUBLIC_AZURE_ENDPOINT,
    NEXT_PUBLIC_AZURE_KEY: process.env.NEXT_PUBLIC_AZURE_KEY,
  }
};

module.exports = nextConfig;