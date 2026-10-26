const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const databasePath = require("./database-path.cjs").databasePath();

const username = process.env.ADMIN_USERNAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!username || !email || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
  console.error("Define ADMIN_USERNAME, ADMIN_EMAIL y ADMIN_PASSWORD (12 caracteres como mínimo, 72 bytes como máximo). No hay credenciales predeterminadas.");
  process.exit(1);
}
const db = new Database(databasePath, { fileMustExist: true });
try {
  if (db.prepare("SELECT id FROM users WHERE lower(username)=lower(?) OR lower(email)=lower(?)").get(username,email)) {
    throw new Error("La cuenta ya existe. Este script no modifica contraseñas ni cuentas existentes.");
  }
  db.prepare("INSERT INTO users (username,email,password_hash,role,status,created_at,updated_at) VALUES (?,?,?,'admin','approved',?,?)")
    .run(username,email,bcrypt.hashSync(password,12),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000));
  console.log("Administrador creado. La contraseña no se muestra ni se registra.");
} finally { db.close(); }
