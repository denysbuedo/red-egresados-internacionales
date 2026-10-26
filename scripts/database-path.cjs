const { existsSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { loadEnvFile } = require("node:process");

function databasePath() {
  const envFile = join(__dirname, "..", ".env");
  if (existsSync(envFile)) loadEnvFile(envFile);
  return resolve(process.env.DATABASE_PATH || join(__dirname, "..", "dev.db"));
}
module.exports = { databasePath };
