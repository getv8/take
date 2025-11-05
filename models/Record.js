const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true // 格式: "08:00"
  },
  checkInTime: {
    type: Date,
    default: null
  },
  date: {
    type: String,
    required: true // 格式: "2024-10-15"
  },
  status: {
    type: String,
    enum: ['未完成', '已完成', '已跳过'],
    default: '未完成'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

recordSchema.index({ userId: 1, date: 1 });
recordSchema.index({ userId: 1, medicineId: 1, date: 1, scheduledTime: 1 });

module.exports = mongoose.model('Record', recordSchema);
