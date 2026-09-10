import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/WASM packages that must run un-bundled under Node, not traced
  // through Turbopack/webpack (which breaks their internal fs/path calls).
  serverExternalPackages: ["@electric-sql/pglite", "sharp"],
};

export default nextConfig;
