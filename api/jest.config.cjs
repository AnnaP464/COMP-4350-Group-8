// jest.config.ts
module.exports = {
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch:  ["**/src/__tests__/UnitTests/*.test.ts"],
      setupFilesAfterEnv: [], // ensure empty
      collectCoverageFrom: ["**/src/__tests__/UnitTests/*.test.ts"]
      // unit can stay parallel
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch:  ["**/src/__tests__/IntegrationTests/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/IntegrationTests/dbsetup.ts"],
      maxWorkers: 1, // run serially
      forceExit: true, // ensure DB connections close
      detectOpenHandles: true,  // warns on hanging handles
      verbose: true,
    }
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "<rootDir>/src/__tests__/coverage/",

};
