const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ams_asset_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function login(username, password) {
  if (!username || !password) {
    return { success: false, message: 'Username and password are required' };
  }
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) {
    return { success: false, message: 'Invalid username or password' };
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return { success: false, message: 'Invalid username or password' };
  }
  const token = signToken(user);
  return {
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        employeeCode: user.employeeCode,
        displayName: user.displayName,
        forcePasswordChange: user.forcePasswordChange
      }
    }
  };
}

async function changePassword(userId, currentPassword, newPassword, confirmPassword) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: 'All password fields are required' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, message: 'New password and confirmation do not match' };
  }
  if (newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long' };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return { success: false, message: 'Current password is incorrect' };
  }
  if (currentPassword === newPassword) {
    return { success: false, message: 'New password must be different from the current password' };
  }

  user.password = newPassword;
  user.forcePasswordChange = false;
  await user.save();
  return { success: true, message: 'Password changed successfully' };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };
  return {
    success: true,
    data: {
      id: user._id,
      username: user.username,
      role: user.role,
      employeeCode: user.employeeCode,
      displayName: user.displayName,
      forcePasswordChange: user.forcePasswordChange
    }
  };
}

module.exports = { login, changePassword, getMe, signToken, JWT_SECRET };
