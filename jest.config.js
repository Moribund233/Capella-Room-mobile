/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/src/test/jest.setup.ts"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": "babel-jest",
  },
  transformIgnorePatterns: [
    // Allow transformation of React Native / Expo packages even when resolved
    // through pnpm's content-addressable store under node_modules/.pnpm/.
    "node_modules/(?!.*((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-css-interop|react-native-reanimated|tailwindcss|msw|@mswjs/.*|@open-draft/.*|@bundled-es-modules/.*|headers-polyfill|is-node-process|outvariant|strict-event-emitter|type-fest|rettime|until-async))",
  ],
};
