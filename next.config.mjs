import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const asyncStorageStub = path.resolve(__dirname, "lib/async-storage-stub.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": asyncStorageStub,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": asyncStorageStub,
      "pino-pretty": false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@react-native-async-storage\/async-storage/,
        asyncStorageStub
      )
    );
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
