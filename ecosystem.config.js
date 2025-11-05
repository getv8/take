// PM2配置文件
module.exports = {
  apps: [{
    name: 'medicine-backend',
    script: './server.js',
    
    // 实例数量
    instances: 1,
    
    // 运行模式
    exec_mode: 'fork',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // 自动重启配置
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '500M',
    
    // 重启策略
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 优雅关闭
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
