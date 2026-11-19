/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que a homologação sobrescreva a compilação do npm run dev.
  distDir: process.env.SIGA_HOMOLOGACAO === "true" ? ".next-homologacao" : ".next",
};

module.exports = nextConfig;
