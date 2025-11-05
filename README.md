# 吃药打卡小程序后端

## 技术栈
- Node.js
- Express
- MongoDB
- JWT认证

## 安装步骤

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

3. 启动MongoDB
确保MongoDB服务已启动

4. 运行项目
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API接口文档

### 用户相关
- POST `/api/users/login` - 微信登录
- GET `/api/users/profile` - 获取用户信息
- PUT `/api/users/profile` - 更新用户信息

### 药品管理
- GET `/api/medicines` - 获取药品列表
- GET `/api/medicines/:id` - 获取药品详情
- POST `/api/medicines` - 添加药品
- PUT `/api/medicines/:id` - 更新药品
- DELETE `/api/medicines/:id` - 删除药品

### 打卡记录
- GET `/api/records/today` - 获取今日打卡记录
- GET `/api/records/date/:date` - 获取指定日期打卡记录
- POST `/api/records/checkin/:id` - 打卡
- POST `/api/records/skip/:id` - 跳过打卡
- POST `/api/records/generate/:date` - 生成指定日期打卡记录

### 统计数据
- GET `/api/statistics/monthly/:year/:month` - 获取月度统计
- GET `/api/statistics/yearly/:year` - 获取年度统计
- GET `/api/statistics/calendar/:year/:month` - 获取日历数据

## 数据模型

### User（用户）
- openid: 微信openid
- nickName: 昵称
- avatarUrl: 头像
- continuousDays: 连续打卡天数
- lastCheckInDate: 最后打卡日期

### Medicine（药品）
- userId: 用户ID
- name: 药品名称
- specification: 规格
- dosage: 服用剂量
- frequency: 服用频率
- reminderTimes: 提醒时间数组
- weekDays: 每周指定日（0-6）

### Record（打卡记录）
- userId: 用户ID
- medicineId: 药品ID
- medicineName: 药品名称
- scheduledTime: 计划时间
- checkInTime: 打卡时间
- date: 日期
- status: 状态（未完成/已完成/已跳过）
