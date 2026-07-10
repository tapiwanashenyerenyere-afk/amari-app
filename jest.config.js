/**
 * Jest config for pure-logic unit tests (lib/**).
 *
 * We intentionally do NOT lean on the full jest-expo React Native test
 * environment for these tests — they exercise plain TypeScript modules
 * (date math, string formatting, category/tier mapping) with no React,
 * native module, or Supabase runtime dependency. Using the jest-expo
 * preset here keeps the babel transform (so TS + `@/` path aliases work
 * exactly like the app) while transformIgnorePatterns covers us if a
 * pure module ever pulls in an RN/Expo ESM package transitively.
 */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|expo-asset|expo-font|expo-constants|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@rnmapbox/.*)/)',
  ],
};
