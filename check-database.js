// 检查数据库数据
require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
const Record = require('./models/Record');
const User = require('./models/User');

async function checkDatabase() {
  try {
    console.log('📊 开始检查数据库...\n');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicine_reminder');
    console.log('✅ 数据库连接成功\n');

    // 检查用户数据
    console.log('👤 ========== 用户数据 ==========');
    const users = await User.find();
    console.log(`总用户数: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  昵称: ${user.nickName}`);
      console.log(`  OpenID: ${user.openid}`);
      console.log(`  连续打卡: ${user.continuousDays} 天`);
      console.log(`  创建时间: ${user.createdAt}`);
    });

    // 检查药品数据
    console.log('\n\n💊 ========== 药品数据 ==========');
    const medicines = await Medicine.find({ isActive: true });
    console.log(`总药品数: ${medicines.length}`);
    medicines.forEach((med, index) => {
      console.log(`\n药品 ${index + 1}:`);
      console.log(`  ID: ${med._id}`);
      console.log(`  名称: ${med.name}`);
      console.log(`  规格: ${med.specification || '未设置'}`);
      console.log(`  用量: ${med.dosage || '未设置'}`);
      console.log(`  频率: ${med.frequency}`);
      console.log(`  提醒时间: ${med.reminderTimes.join(', ')}`);
      console.log(`  每周: ${med.weekDays.length > 0 ? med.weekDays.join(', ') : '每天'}`);
      console.log(`  创建时间: ${med.createdAt}`);
    });

    // 检查打卡记录
    console.log('\n\n📝 ========== 打卡记录 ==========');
    const records = await Record.find().sort({ date: -1, scheduledTime: 1 }).limit(20);
    console.log(`最近记录数: ${records.length}`);
    
    // 按日期分组显示
    const recordsByDate = {};
    records.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = [];
      }
      recordsByDate[record.date].push(record);
    });

    Object.keys(recordsByDate).sort().reverse().forEach(date => {
      const dayRecords = recordsByDate[date];
      console.log(`\n📅 ${date}:`);
      dayRecords.forEach(record => {
        console.log(`  ${record.scheduledTime} - ${record.medicineName} [${record.status}]`);
        if (record.checkInTime) {
          console.log(`    ✓ 打卡时间: ${new Date(record.checkInTime).toLocaleString('zh-CN')}`);
        }
      });
    });

    // 统计信息
    console.log('\n\n📊 ========== 统计信息 ==========');
    const totalRecords = await Record.countDocuments();
    const completedRecords = await Record.countDocuments({ status: '已完成' });
    const skippedRecords = await Record.countDocuments({ status: '已跳过' });
    const pendingRecords = await Record.countDocuments({ status: '未完成' });
    
    console.log(`总记录数: ${totalRecords}`);
    console.log(`已完成: ${completedRecords}`);
    console.log(`已跳过: ${skippedRecords}`);
    console.log(`未完成: ${pendingRecords}`);
    
    if (totalRecords > 0) {
      const completionRate = Math.round((completedRecords / totalRecords) * 100);
      console.log(`完成率: ${completionRate}%`);
    }

    // 今日记录
    console.log('\n\n🗓️ ========== 今日记录 ==========');
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await Record.find({ date: today });
    console.log(`今日日期: ${today}`);
    console.log(`今日记录数: ${todayRecords.length}`);
    
    if (todayRecords.length > 0) {
      todayRecords.forEach(record => {
        console.log(`\n  ${record.scheduledTime} - ${record.medicineName}`);
        console.log(`  状态: ${record.status}`);
        if (record.checkInTime) {
          console.log(`  打卡时间: ${new Date(record.checkInTime).toLocaleString('zh-CN')}`);
        }
      });
      
      const todayCompleted = todayRecords.filter(r => r.status === '已完成').length;
      console.log(`\n  今日完成: ${todayCompleted}/${todayRecords.length}`);
    } else {
      console.log('  ⚠️ 今日暂无记录');
    }

    console.log('\n✅ 检查完成！\n');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 数据库连接已关闭');
    process.exit(0);
  }
}

checkDatabase();
