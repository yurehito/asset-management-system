const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    if (result.success) res.json(result);
    else res.status(401).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword, confirmPassword);
    if (result.success) res.json(result);
    else res.status(400).json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getMe(req, res) {
  try {
    const result = await authService.getMe(req.user.id);
    if (result.success) res.json(result);
    else res.status(404).json(result);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { login, changePassword, getMe };
