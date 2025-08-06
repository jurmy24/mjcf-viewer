import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // config options here, defaults imply no additional config needed

  transpilePackages: ["three", "lil-gui"],

  webpack: (config) => {
    // Handle Three.js examples
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/addons": "./node_modules/three/examples/jsm",
    };
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Set up WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
