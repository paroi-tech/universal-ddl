module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // roots: [
  //   "<rootDir>/src",
  //   "<rootDir>/tests",
  // ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: [
    "js",
    "json",
    "ts",
  ],
  // moduleNameMapper: {
  //   "^@/(.*)$": "<rootDir>/tests/$1",
  // },
  testMatch: [
    "**/(src|tests)/**/*.spec.(js|ts)",
  ],
};
