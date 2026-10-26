import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules/**"],
  },
  {
    // The existing client fetch effects are being migrated incrementally.
    // Keep React's performance diagnostic visible without blocking security releases.
    files: ["src/**/*.{ts,tsx}"],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
];

export default eslintConfig;
