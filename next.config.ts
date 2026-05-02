import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/images/**" }],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
