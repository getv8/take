const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicine_reminder')
.then(() => {
  console.log('✅ MongoDB连接成功');
  console.log('📊 数据库:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicine_reminder');
})
.catch((err) => {
  console.error('❌ MongoDB连接失败:', err.message);
  console.error('💡 请检查:');
  console.error('   1. MongoDB服务是否启动');
  console.error('   2. 连接地址是否正确:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicine_reminder');
  console.error('   3. 防火墙是否阻止连接');
});

// 路由
app.use('/api/users', require('./routes/users'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/records', require('./routes/records'));
app.use('/api/statistics', require('./routes/statistics'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器错误', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
