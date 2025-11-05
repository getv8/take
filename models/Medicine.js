const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specification: {
    type: String,
    default: '',
    trim: true
  },
  dosage: {
    type: String,
    default: '',
    trim: true
  },
  frequency: {
    type: String,
    enum: ['每日1次', '每日2次', '每日3次', '每周指定日'],
    default: '每日1次'
  },
  reminderTimes: [{
    type: String // 格式: "08:00"
  }],
  weekDays: [{
    type: Number, // 0-6 表示周日到周六
    min: 0,
    max: 6
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);
