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
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./report",
        filename: "report.html",
        inlineSource: true,
        darkTheme: true,
      },
    ],
    [
      "jest-stare",
      {
        resultDir: "./report",
      },
    ],
  ],
};

export default config;
