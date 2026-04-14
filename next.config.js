/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  // Fix for MetaMask SDK & WalletConnect issues
  experimental: {
    serverComponentsExternalPackages: [
      "pino",
      "pino-pretty",
      "@metamask/sdk",
      "@walletconnect",
    ],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "react-native": false,           // Important for MetaMask SDK
      "@react-native-async-storage/async-storage": false,
    };

    // Ignore pino-pretty warning
    config.externals = [...(config.externals || []), "pino-pretty"];

    return config;
  },

  // PWA config (already hai toh yeh rakh sakte ho)
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
};

export default nextConfig;
