module.exports = {
  apps: [
    {
      name: 'dark-bot',
      script: '.',
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
