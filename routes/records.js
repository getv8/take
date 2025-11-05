const express = require('express');
const router = express.Router();
const Record = require('../models/Record');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 获取今日打卡记录
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const records = await Record.find({
      userId: req.userId,
      date: dateStr
    }).sort({ scheduledTime: 1 });

    // 统计今日完成情况
    const totalCount = records.length;
    const completedCount = records.filter(r => r.status === '已完成').length;

    res.json({
      success: true,
      data: {
        records,
        totalCount,
        completedCount,
        date: dateStr
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取今日打卡记录失败', error: error.message });
  }
});

// 获取指定日期的打卡记录
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;

    const records = await Record.find({
      userId: req.userId,
      date
    }).sort({ scheduledTime: 1 });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取打卡记录失败', error: error.message });
  }
});

// 打卡
router.post('/checkin/:id', auth, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!record) {
      return res.status(404).json({ success: false, message: '打卡记录不存在' });
    }

    if (record.status === '已完成') {
      return res.status(400).json({ success: false, message: '该记录已完成打卡' });
    }

    record.status = '已完成';
    record.checkInTime = new Date();
    await record.save();

    // 更新用户连续打卡天数
    await updateContinuousDays(req.userId);

    res.json({
      success: true,
      data: record,
      message: '打卡成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '打卡失败', error: error.message });
  }
});

// 跳过打卡
router.post('/skip/:id', auth, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!record) {
      return res.status(404).json({ success: false, message: '打卡记录不存在' });
    }

    record.status = '已跳过';
    await record.save();

    res.json({
      success: true,
      data: record,
      message: '已跳过'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

// 生成指定日期的打卡记录
router.post('/generate/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // 获取所有活跃的药品
    const medicines = await Medicine.find({
      userId: req.userId,
      isActive: true
    });

    let createdCount = 0;

    for (const medicine of medicines) {
      // 检查是否需要为该日期创建记录
      let shouldCreate = true;
      if (medicine.frequency === '每周指定日') {
        shouldCreate = medicine.weekDays.includes(dayOfWeek);
      }

      if (shouldCreate) {
        for (const time of medicine.reminderTimes) {
          // 检查是否已存在
          const existing = await Record.findOne({
            userId: req.userId,
            medicineId: medicine._id,
            date,
            scheduledTime: time
          });

          if (!existing) {
            await Record.create({
              userId: req.userId,
              medicineId: medicine._id,
              medicineName: medicine.name,
              scheduledTime: time,
              date,
              status: '未完成'
            });
            createdCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `成功生成${createdCount}条打卡记录`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '生成打卡记录失败', error: error.message });
  }
});

// 辅助函数：更新连续打卡天数
async function updateContinuousDays(userId) {
  const user = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheckIn = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null;

  if (lastCheckIn) {
    lastCheckIn.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 同一天，不增加
      return;
    } else if (diffDays === 1) {
      // 连续打卡
      user.continuousDays += 1;
    } else {
      // 中断了，重新开始
      user.continuousDays = 1;
    }
  } else {
    // 第一次打卡
    user.continuousDays = 1;
  }

  user.lastCheckInDate = new Date();
  await user.save();
}

module.exports = router;
