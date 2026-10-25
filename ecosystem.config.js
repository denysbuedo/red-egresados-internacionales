// Reconciled from the VM: SQLite runs in one process.
module.exports = {
  apps: [{
    name: "red-egresados",
    cwd: __dirname,
    script: "node_modules/next/dist/bin/next",
    args: "start -H 127.0.0.1",
    instances: 1,
    exec_mode: "fork",
    env_production: { NODE_ENV: "production", PORT: 3000 },
    max_memory_restart: "1G",
    error_file: "/var/log/pm2/egresados-error.log",
    out_file: "/var/log/pm2/egresados-out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }],
};
