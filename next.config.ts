import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Servidor autocontenido (.next/standalone) para Azure App Service: sube solo lo que corre, sin node_modules completo
  output: "standalone",
  webpack: (config) => {
    // Dependencias opcionales de los conectores de wagmi que no se usan en Loopi
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core/client": false,
      "@x402/evm": false,
      "@x402/evm/exact/client": false,
      "@x402/evm/upto/client": false,
      "@x402/svm/exact/client": false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
