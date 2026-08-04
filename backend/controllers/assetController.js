const assetService = require('../services/assetService');
const { COMPUTER_ASSET_TYPES, PERIPHERAL_ASSET_TYPES, NETWORK_ASSET_TYPES } = require('../models/Asset');

const ALL_TYPES = [...COMPUTER_ASSET_TYPES, ...PERIPHERAL_ASSET_TYPES, ...NETWORK_ASSET_TYPES];

const FIELDS_BY_TYPE = {
  Desktop: ['Username', 'Employee Code', 'Asset Code', 'Hostname', 'Storage', 'RAM', 'Processor', 'Serial Number', 'Location', 'Status'],
  Laptop: ['Username', 'Employee Code', 'Asset Code', 'Hostname', 'Storage', 'RAM', 'Processor', 'Serial Number', 'Location', 'Status'],
  Printer: ['Asset Code', 'Serial Number', 'IP Address', 'Location', 'Status'],
  Scanner: ['Asset Code', 'Serial Number', 'Model', 'Location', 'Status'],
  Router: ['Username', 'Asset Code', 'Hostname', 'Serial Number', 'IP Address', 'Location', 'Status'],
  Switch: ['Username', 'Asset Code', 'Hostname', 'Serial Number', 'IP Address', 'Location', 'Status'],
  Firewall: ['Username', 'Asset Code', 'Hostname', 'Serial Number', 'IP Address', 'Location', 'Status'],
  'IoT Devices': ['Username', 'Asset Code', 'Hostname', 'Serial Number', 'IP Address', 'Location', 'Status'],
};

const FIELD_ACCESSORS = {
  'Username': (a) => a.username,
  'Employee Code': (a) => a.employeeCode,
  'Asset Code': (a) => a.assetCode,
  'Hostname': (a) => a.hostname,
  'Storage': (a) => a.storage,
  'RAM': (a) => a.ram,
  'Processor': (a) => a.processor,
  'Serial Number': (a) => a.serialNumber,
  'IP Address': (a) => a.ipAddress,
  'Model': (a) => a.model,
  'Location': (a) => a.location,
  'Status': (a) => a.status,
};

function csvHeadersFor(type) {
  const fields = FIELDS_BY_TYPE[type] || FIELDS_BY_TYPE.Desktop;
  return fields.join(',') + '\n';
}

function csvRowFor(a, type) {
  const val = (v) => `"${(v || '-').replace(/"/g, '""')}"`;
  const fields = FIELDS_BY_TYPE[type] || FIELDS_BY_TYPE.Desktop;
  return fields.map(f => val(FIELD_ACCESSORS[f](a))).join(',');
}

const AssetController = {
  async getAllAssets(req, res) {
    try {
      const assets = await assetService.getAllAssets();
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async createAsset(req, res) {
    try {
      const result = await assetService.createAsset(req.body);
      if (result.success) res.status(201).json(result);
      else res.status(400).json(result);
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getAssetByCode(req, res) {
    try {
      const asset = await assetService.getAssetByCode(req.params.assetCode);
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      res.json({ success: true, data: asset });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getAssetBySerialNumber(req, res) {
    try {
      const asset = await assetService.getAssetBySerialNumber(req.params.serialNumber);
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found with the provided Serial Number' });
      res.json({ success: true, data: asset });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getAssetByIdentifier(req, res) {
    try {
      const asset = await assetService.getAssetByIdentifier(req.params.identifier);
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      res.json({ success: true, data: asset });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async updateAsset(req, res) {
    try {
      const result = await assetService.updateAsset(req.params.id, req.body);
      if (result.success) res.json(result);
      else res.status(400).json(result);
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async deleteAsset(req, res) {
    try {
      const result = await assetService.deleteAsset(req.params.assetCode);
      if (result.success) res.json(result);
      else res.status(404).json(result);
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getAssetsByType(req, res) {
    try {
      const assets = await assetService.getAssetsByType(req.params.assetType);
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getAssetsByDepartment(req, res) {
    try {
      const assets = await assetService.getAssetsByDepartment(req.params.department);
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getAssetsByTypeAndDepartment(req, res) {
    try {
      const { assetType, department } = req.params;
      const assets = await assetService.getAssetsByTypeAndDepartment(assetType, department);
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async searchAssets(req, res) {
    try {
      const { q, assetType, department, status } = req.query;
      const filters = {};
      if (assetType) filters.assetType = assetType;
      if (department) filters.department = department;
      if (status && status !== 'All') filters.status = status;
      const assets = await assetService.searchAssets(q || '', filters);
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getDepartmentsByAssetType(req, res) {
    try {
      const departments = await assetService.getDepartmentsByAssetType(req.params.assetType);
      res.json({ success: true, data: departments });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async getStats(req, res) {
    try {
      const stats = await assetService.getAssetStats();
      res.json({ success: true, data: stats });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async globalSearch(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.json({ success: true, data: [], count: 0 });
      const assets = await assetService.globalSearch(q);
      res.json({ success: true, data: assets, count: assets.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async downloadAssetsCsv(req, res) {
    try {
      const { q, assetType, department, status } = req.query;
      const filters = {};
      if (assetType) filters.assetType = assetType;
      if (department) filters.department = department;
      if (status && status !== 'All') filters.status = status;

      const assets = await assetService.searchAssets(q || '', filters);
      const typeForProfile = assetType || (assets[0] && assets[0].assetType);
      const csvHeaders = typeForProfile ? csvHeadersFor(typeForProfile) : csvHeadersFor('computer');

      const csvRows = assets.map(a => csvRowFor(a, a.assetType)).join('\n');

      const filename = `assets_export_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvHeaders + csvRows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  },

  async downloadAllCsv(req, res) {
    try {
      const grouped = await assetService.getAllAssetsGrouped();
      const val = (v) => `"${(v || '-').replace(/"/g, '""')}"`;
      const lines = [];

      for (const type of ALL_TYPES) {
        const assets = grouped[type] || [];
        const fields = FIELDS_BY_TYPE[type] || FIELDS_BY_TYPE.Desktop;
        lines.push(`${type} - ${assets.length} Asset${assets.length !== 1 ? 's' : ''}`);
        lines.push(fields.join(','));
        if (assets.length === 0) {
          lines.push('No assets found');
        } else {
          assets.forEach(a => {
            lines.push(fields.map(f => val(FIELD_ACCESSORS[f](a))).join(','));
          });
        }
        lines.push('--------------------------------------------');
        lines.push('');
      }

      const filename = `all_assets_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(lines.join('\n'));
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
  }
};

module.exports = AssetController;
