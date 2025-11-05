const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Record = require('../models/Record');
const auth = require('../middleware/auth');

// 获取所有药品
router.get('/', auth, async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      userId: req.userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取药品列表失败', error: error.message });
  }
});

// 获取单个药品详情
router.get('/:id', auth, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: '药品不存在' });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取药品详情失败', error: error.message });
  }
});

// 添加药品
router.post('/', auth, async (req, res) => {
  try {
    const { name, specification, dosage, frequency, reminderTimes, weekDays } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '药品名称不能为空' });
    }

    if (!reminderTimes || reminderTimes.length === 0) {
      return res.status(400).json({ success: false, message: '请设置提醒时间' });
    }

    const medicine = new Medicine({
      userId: req.userId,
      name,
      specification,
      dosage,
      frequency,
      reminderTimes,
      weekDays: weekDays || []
    });

    await medicine.save();

    // 创建今日打卡记录
    await createTodayRecords(req.userId, medicine);

    res.status(201).json({
      success: true,
      data: medicine,
      message: '药品添加成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '添加药品失败', error: error.message });
  }
});

// 更新药品
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, specification, dosage, frequency, reminderTimes, weekDays } = req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: '药品不存在' });
    }

    if (name) medicine.name = name;
    if (specification !== undefined) medicine.specification = specification;
    if (dosage !== undefined) medicine.dosage = dosage;
    if (frequency) medicine.frequency = frequency;
    if (reminderTimes) medicine.reminderTimes = reminderTimes;
    if (weekDays !== undefined) medicine.weekDays = weekDays;

    await medicine.save();

    res.json({
      success: true,
      data: medicine,
      message: '药品更新成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新药品失败', error: error.message });
  }
});

// 删除药品（软删除）
router.delete('/:id', auth, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: '药品不存在' });
    }

    medicine.isActive = false;
    await medicine.save();

    res.json({
      success: true,
      message: '药品删除成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除药品失败', error: error.message });
  }
});

// 批量删除所有药品
router.delete('/all', auth, async (req, res) => {
  try {
    // 软删除所有药品
    await Medicine.updateMany(
      { userId: req.userId, isActive: true },
      { isActive: false }
    );

    // 删除所有相关的打卡记录
    await Record.deleteMany({ userId: req.userId });

    res.json({
      success: true,
      message: '所有药品已清除'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '清除失败', error: error.message });
  }
});

// 辅助函数：为今日创建打卡记录
async function createTodayRecords(userId, medicine) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // 检查是否需要创建今日记录
  let shouldCreate = true;
  if (medicine.frequency === '每周指定日') {
    shouldCreate = medicine.weekDays.includes(dayOfWeek);
  }

  if (shouldCreate) {
    for (const time of medicine.reminderTimes) {
      // 检查是否已存在
      const existing = await Record.findOne({
        userId,
        medicineId: medicine._id,
        date: dateStr,
        scheduledTime: time
      });

      if (!existing) {
        await Record.create({
          userId,
          medicineId: medicine._id,
          medicineName: medicine.name,
          scheduledTime: time,
          date: dateStr,
          status: '未完成'
        });
      }
    }
  }
}

module.exports = router;
