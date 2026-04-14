/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next 15/16: serverExternalPackages
  serverExternalPackages: ["pino", "pino-pretty"],

  // Tell Next.js 16 to allow Turbopack even with custom webpack
  experimental: {
    turbo: {
      resolveAlias: {
        // This is how you handle fallbacks in Turbopack
        fs: false,
        net: false,
        tls: false,
      },
    },
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "react-native": false,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals = [...(config.externals || []), "pino-pretty"];
    return config;
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;