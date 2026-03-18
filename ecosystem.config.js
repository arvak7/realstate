// PM2 process configuration for PRE/PRO environments
// Usage: pm2 start ecosystem.config.js
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'realstate-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env_file: './backend/.env',
      watch: false,
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'realstate-frontend',
      cwd: './web',
      script: 'npm',
      args: 'start',  // requires: npm run build first
      env_file: './web/.env.local',
      watch: false,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
