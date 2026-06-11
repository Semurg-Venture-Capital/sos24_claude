import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Самодостаточный сервер для Docker-образа (.next/standalone).
  output: "standalone",
  // Монорепо: корень для трассировки файлов standalone (иначе Next тянет лишнее/мало).
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
