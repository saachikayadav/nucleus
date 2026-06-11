/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Silence the NEXTAUTH_URL warning on Vercel — Vercel sets VERCEL_URL automatically
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? `https://${process.env.VERCEL_URL}`,
  },
};

module.exports = nextConfig;
