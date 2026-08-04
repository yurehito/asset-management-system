const Asset = require("../models/Asset");
const {
  COMPUTER_ASSET_TYPES,
  PERIPHERAL_ASSET_TYPES,
  NETWORK_ASSET_TYPES,
  ALL_ASSET_TYPES,
} = require("../models/Asset");

const DEPARTMENT_REQUIRED_TYPES = [
  ...COMPUTER_ASSET_TYPES,
];

class AssetService {
  async getAllAssets() {
    return await Asset.find({}).sort({ createdAt: -1 });
  }

  async createAsset(data) {
    const { assetType, assetCode, serialNumber } = data;

  if (!assetType) {
    return { success: false, message: 'Asset Type is required' };
  }

    const isComputerType = COMPUTER_ASSET_TYPES.includes(assetType);
    const isPeripheralType = PERIPHERAL_ASSET_TYPES.includes(assetType);
    const isNetworkType = NETWORK_ASSET_TYPES.includes(assetType);

    if (DEPARTMENT_REQUIRED_TYPES.includes(assetType) && !data.department) {
      return {
        success: false,
        message: "Department is required for this asset type",
      };
    }

    const existing = await Asset.findOne({
      $or: [{ assetCode }, { serialNumber }],
    });
    if (existing) {
      return {
        success: false,
        message:
          "An asset with this Asset Code or Serial Number already exists",
      };
    }

const assetData = {
  assetType,
  department: DEPARTMENT_REQUIRED_TYPES.includes(assetType)
    ? data.department || ""
    : "",
  assetCode,
  serialNumber,
  username: isComputerType ? data.username || "" : "",
  employeeCode: isComputerType ? data.employeeCode || "" : "",
  hostname: isComputerType ? data.hostname || "" : "",
  storage: isComputerType ? data.storage || "" : "",
  ram: isComputerType ? data.ram || "" : "",
  processor: isComputerType ? data.processor || "" : "",
  model: assetType === "Scanner" ? data.model || "" : "",
  ipAddress: assetType === "Printer" ? data.ipAddress || "" : "",
  location:
    isNetworkType || isPeripheralType || isComputerType
      ? data.location || ""
      : "",
  status: data.status || "Functional",
};

    const asset = new Asset(assetData);
    await asset.save();
    return { success: true, message: "Asset added successfully", data: asset };
  }

  async getAssetByCode(assetCode) {
    return await Asset.findOne({ assetCode });
  }

  async getAssetBySerialNumber(serialNumber) {
    return await Asset.findOne({ serialNumber });
  }

  async getAssetByIdentifier(identifier) {
    if (!identifier) return null;
    return await Asset.findOne({
      $or: [{ assetCode: identifier }, { serialNumber: identifier }],
    });
  }

  async updateAsset(id, data) {
    const asset = await Asset.findById(id);
    if (!asset) {
      return { success: false, message: 'Asset not found' };
    }

    const { assetCode, serialNumber } = data;
    const isComputerType = COMPUTER_ASSET_TYPES.includes(asset.assetType);
    const isPeripheralType = PERIPHERAL_ASSET_TYPES.includes(asset.assetType);
    const isNetworkType = NETWORK_ASSET_TYPES.includes(asset.assetType);

    if (serialNumber && serialNumber !== asset.serialNumber) {
      const existingSerial = await Asset.findOne({ serialNumber, _id: { $ne: id } });
      if (existingSerial) {
        return { success: false, message: 'An asset with this Serial Number already exists' };
      }
    }

    if (assetCode && assetCode !== asset.assetCode) {
      const existingCode = await Asset.findOne({ assetCode, _id: { $ne: id } });
      if (existingCode) {
        return { success: false, message: 'An asset with this Asset Code already exists' };
      }
    }

    if (assetCode !== undefined) asset.assetCode = assetCode;
    if (serialNumber !== undefined) asset.serialNumber = serialNumber;
    if (isComputerType) {
      if (data.username !== undefined) asset.username = data.username;
      if (data.employeeCode !== undefined) asset.employeeCode = data.employeeCode;
      if (data.hostname !== undefined) asset.hostname = data.hostname;
      if (data.storage !== undefined) asset.storage = data.storage;
      if (data.ram !== undefined) asset.ram = data.ram;
      if (data.processor !== undefined) asset.processor = data.processor;
    }
    if (asset.assetType === 'Scanner') {
      if (data.model !== undefined) asset.model = data.model;
    }
    if (asset.assetType === 'Printer' || isNetworkType) {
      if (data.ipAddress !== undefined) asset.ipAddress = data.ipAddress;
    }
    if (isNetworkType) {
      if (data.username !== undefined) asset.username = data.username;
      if (data.hostname !== undefined) asset.hostname = data.hostname;
    }
    if (isComputerType || isPeripheralType || isNetworkType) {
      if (data.location !== undefined) asset.location = data.location;
    }
    if (data.status !== undefined) asset.status = data.status;

    asset.updatedAt = Date.now();
    await asset.save();
    return { success: true, message: 'Asset updated successfully', data: asset };
  }

  async deleteAsset(identifier) {
    const asset = await Asset.findOne({
      $or: [{ assetCode: identifier }, { serialNumber: identifier }],
    });
    if (!asset) {
      return {
        success: false,
        message: "Asset not found",
      };
    }
    await Asset.deleteOne({ _id: asset._id });
    return {
      success: true,
      message: "Asset removed successfully",
      data: { assetCode: asset.assetCode },
    };
  }

  async getAssetsByType(assetType) {
    return await Asset.find({ assetType }).sort({ createdAt: -1 });
  }
  async getAssetsByDepartment(department) {
    return await Asset.find({ department }).sort({ createdAt: -1 });
  }
  async getAssetsByTypeAndDepartment(assetType, department) {
    return await Asset.find({ assetType, department }).sort({ createdAt: -1 });
  }

  async searchAssets(searchTerm, filters = {}) {
    const query = {};
    if (filters.assetType) query.assetType = filters.assetType;
    if (filters.department) query.department = filters.department;

    if (searchTerm) {
      query.$or = [
        { username: { $regex: searchTerm, $options: "i" } },
        { employeeCode: { $regex: searchTerm, $options: "i" } },
        { assetCode: { $regex: searchTerm, $options: "i" } },
        { hostname: { $regex: searchTerm, $options: "i" } },
        { serialNumber: { $regex: searchTerm, $options: "i" } },
        { location: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (filters.status) query.status = filters.status;
    return await Asset.find(query).sort({ createdAt: -1 });
  }

  async getDepartmentsByAssetType(assetType) {
    return await Asset.aggregate([
      {
        $match: {
          assetType,
          department: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }

  async getAssetStats() {
    const total = await Asset.countDocuments();
    const byType = await Asset.aggregate([
      { $group: { _id: "$assetType", count: { $sum: 1 } } },
    ]);
    const byStatus = await Asset.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byDepartment = await Asset.aggregate([
      { $match: { department: { $ne: "" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return { total, byType, byStatus, byDepartment };
  }

  async globalSearch(searchTerm) {
    if (!searchTerm) return [];
    const query = {
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { employeeCode: { $regex: searchTerm, $options: "i" } },
        { assetCode: { $regex: searchTerm, $options: "i" } },
        { serialNumber: { $regex: searchTerm, $options: "i" } },
      ],
    };
    return await Asset.find(query).sort({ createdAt: -1 });
  }

  async getAllAssetsGrouped() {
    const result = {};
    for (const type of ALL_ASSET_TYPES) {
      result[type] = await Asset.find({ assetType: type }).sort({
        createdAt: -1,
      });
    }
    return result;
  }
}

module.exports = new AssetService();
