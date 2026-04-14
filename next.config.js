/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next 15: serverExternalPackages (replaces serverComponentsExternalPackages)
  serverExternalPackages: ["pino", "pino-pretty"],

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
