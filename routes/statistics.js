const express = require('express');
const router = express.Router();
const Record = require('../models/Record');
const auth = require('../middleware/auth');

// 获取月度统计
router.get('/monthly/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // 获取该月的所有日期
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 获取该月所有记录
    const records = await Record.find({
      userId: req.userId,
      date: { $gte: startDateStr, $lte: endDateStr }
    });

    // 按日期分组统计
    const dailyStats = {};
    records.forEach(record => {
      if (!dailyStats[record.date]) {
        dailyStats[record.date] = {
          total: 0,
          completed: 0,
          skipped: 0,
          pending: 0
        };
      }
      dailyStats[record.date].total++;
      if (record.status === '已完成') {
        dailyStats[record.date].completed++;
      } else if (record.status === '已跳过') {
        dailyStats[record.date].skipped++;
      } else {
        dailyStats[record.date].pending++;
      }
    });

    // 计算月度总体统计
    const totalRecords = records.length;
    const completedRecords = records.filter(r => r.status === '已完成').length;
    const completionRate = totalRecords > 0 
      ? Math.round((completedRecords / totalRecords) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        totalRecords,
        completedRecords,
        completionRate,
        dailyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取月度统计失败', error: error.message });
  }
});

// 获取年度统计
router.get('/yearly/:year', auth, async (req, res) => {
  try {
    const { year } = req.params;
    
    const startDateStr = `${year}-01-01`;
    const endDateStr = `${year}-12-31`;

    const records = await Record.find({
      userId: req.userId,
      date: { $gte: startDateStr, $lte: endDateStr }
    });

    // 按月份统计
    const monthlyStats = {};
    for (let i = 1; i <= 12; i++) {
      monthlyStats[i] = {
        total: 0,
        completed: 0,
        completionRate: 0
      };
    }

    records.forEach(record => {
      const month = parseInt(record.date.split('-')[1]);
      monthlyStats[month].total++;
      if (record.status === '已完成') {
        monthlyStats[month].completed++;
      }
    });

    // 计算每月完成率
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      stats.completionRate = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100) 
        : 0;
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取年度统计失败', error: error.message });
  }
});

// 获取打卡日历数据
router.get('/calendar/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const records = await Record.find({
      userId: req.userId,
      date: { $gte: startDateStr, $lte: endDateStr }
    });

    // 按日期分组
    const calendarData = [];
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecords = records.filter(r => r.date === dateStr);
      
      const total = dayRecords.length;
      const completed = dayRecords.filter(r => r.status === '已完成').length;
      
      let status = 'none'; // none, partial, all, empty
      if (total === 0) {
        status = 'empty';
      } else if (completed === total) {
        status = 'all';
      } else if (completed > 0) {
        status = 'partial';
      } else {
        status = 'none';
      }

      calendarData.push({
        date: dateStr,
        day,
        total,
        completed,
        status
      });
    }

    res.json({
      success: true,
      data: calendarData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取日历数据失败', error: error.message });
  }
});

module.exports = router;
