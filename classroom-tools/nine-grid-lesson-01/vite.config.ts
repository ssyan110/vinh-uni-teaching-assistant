import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/vinh-uni-teaching-assistant/classroom-tools/nine-grid-lesson-01/",
  base: "./",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
