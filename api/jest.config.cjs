module.exports = {
  preset: "ts-jest",
  testEnvironment: "node", // crucial for Express API tests
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/src/__tests__/**/*.ts"],
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // remove this line
};