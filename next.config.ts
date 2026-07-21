import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v1: não deixar avisos de lint travarem o deploy na Vercel.
  // O type-check do TypeScript continua ativo (erros reais ainda barram o build).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
