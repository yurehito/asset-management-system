const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const issueController = require('../controllers/issueController');
const authController = require('../controllers/authController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Auth routes (public)
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);
router.post('/auth/change-password', authMiddleware, authController.changePassword);

// All asset read routes require authentication (both admin and user)
router.get('/assets', authMiddleware, assetController.getAllAssets);
router.get('/assets/search', authMiddleware, assetController.searchAssets);
router.get('/assets/stats', authMiddleware, assetController.getStats);
router.get('/assets/global-search', authMiddleware, assetController.globalSearch);
router.get('/assets/download/csv', authMiddleware, assetController.downloadAssetsCsv);
router.get('/assets/download/all', authMiddleware, assetController.downloadAllCsv);
router.get('/assets/type/:assetType', authMiddleware, assetController.getAssetsByType);
router.get('/assets/department/:department', authMiddleware, assetController.getAssetsByDepartment);
router.get('/assets/type/:assetType/department/:department', authMiddleware, assetController.getAssetsByTypeAndDepartment);
router.get('/assets/code/:assetCode', authMiddleware, assetController.getAssetByCode);
router.get('/assets/serial/:serialNumber', authMiddleware, assetController.getAssetBySerialNumber);
router.get('/assets/identifier/:identifier', authMiddleware, assetController.getAssetByIdentifier);
router.get('/departments/:assetType', authMiddleware, assetController.getDepartmentsByAssetType);

// Mutation routes require admin
router.post('/assets', authMiddleware, requireAdmin, assetController.createAsset);
router.put('/assets/:id', authMiddleware, requireAdmin, assetController.updateAsset);
router.delete('/assets/code/:assetCode', authMiddleware, requireAdmin, assetController.deleteAsset);

// Issue (submit/reissue) routes require admin
router.post('/submits', authMiddleware, requireAdmin, issueController.issueAsset);
router.post('/submits/reissue', authMiddleware, requireAdmin, issueController.reissueAsset);
router.get('/submits', authMiddleware, requireAdmin, issueController.getIssues);

module.exports = router;
