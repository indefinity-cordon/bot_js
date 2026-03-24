export default {
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  globalSetup: "./.tests/prepare_tests.js",
  testMatch: ["**/.tests/**/*.test.js"],
  verbose: true,
  transform: {},
};
