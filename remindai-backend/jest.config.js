module.exports = {
  testEnvironment: "node",
  setupFiles: ["./tests/loadEnv.js"],
  testTimeout: 15000,
  testMatch: ["**/tests/**/*.test.js"],
};
