const expo = require("eslint-config-expo/flat");

module.exports = [
  ...expo,
  {
    ignores: [".expo/**", "node_modules/**", "dist/**"],
  },
];
