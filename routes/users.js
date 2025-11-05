const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 微信登录
router.post('/login', async (req, res) => {
  try {
    const { code, nickName, avatarUrl } = req.body;

    // 注意：实际开发中需要调用微信API验证code并获取openid
    // 这里简化处理，使用code作为模拟的openid
    const openid = code || `test_${Date.now()}`;

    let user = await User.findOne({ openid });

    if (!user) {
      user = new User({
        openid,
        nickName: nickName || '用户',
        avatarUrl: avatarUrl || ''
      });
      await user.save();
    } else {
      // 更新用户信息
      if (nickName) user.nickName = nickName;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, openid: user.openid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          continuousDays: user.continuousDays
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
});

// 获取用户信息
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      success: true,
      data: {
        id: user._id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        continuousDays: user.continuousDays,
        lastCheckInDate: user.lastCheckInDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
});

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickName, avatarUrl, phone } = req.body;
    const user = await User.findById(req.userId);

    if (nickName) user.nickName = nickName;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新用户信息失败', error: error.message });
  }
});

module.exports = router;
