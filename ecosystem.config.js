const path = require('path');

module.exports = {
  apps: [{
    name: 'pariprashna',
    script: './index.js',
    cwd: path.join(__dirname, 'server'),
    env: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    // Auto-restart if the app crashes
    autorestart: true,
    // Watch disabled by default — enable with: pm2 start ecosystem.config.js --watch
    watch: false,
    // Max memory before auto-restart (prevents memory leaks)
    max_memory_restart: '500M',
    // Restart delay
    restart_delay: 2000,
    // Max restart attempts within 10 seconds (prevents crash loops)
    max_restarts: 10,
    min_uptime: '5s',
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    // On unexpected exit, auto-restart
    exp_backoff_restart_delay: 100,
    // Graceful shutdown
    kill_timeout: 10000,
    listen_timeout: 3000,
  }]
};
