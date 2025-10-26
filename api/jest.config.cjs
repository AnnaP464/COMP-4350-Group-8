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
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/dbsetup.ts"],
      maxWorkers: 1, // run serially
      runInBand: true,
      detectOpenHandles: true,  // warns on hanging handles
    }
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "<rootDir>/src/__tests__/coverage/",

};
