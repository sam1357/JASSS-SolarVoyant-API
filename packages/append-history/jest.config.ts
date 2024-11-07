import type { Config } from "jest";
import { defaults } from "jest-config";

const config: Config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, "mts"],
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "@src/(.*)": "<rootDir>/src/$1",
    "@types/(.*)": "<rootDir>/src/types/$1",
  },
  setupFiles: ["./jest.setup.ts"],
  collectCoverage: true,
  coverageReporters: ["text-summary", "html"],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
};

export default config;
