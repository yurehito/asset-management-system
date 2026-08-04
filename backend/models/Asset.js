const mongoose = require('mongoose');

const COMPUTER_ASSET_TYPES = ['Desktop', 'Laptop'];
const PERIPHERAL_ASSET_TYPES = ['Scanner', 'Printer'];
const NETWORK_ASSET_TYPES = ['Router', 'Switch', 'Firewall', 'IoT Devices'];
const ALL_ASSET_TYPES = [
  ...COMPUTER_ASSET_TYPES,
  ...PERIPHERAL_ASSET_TYPES,
  ...NETWORK_ASSET_TYPES
];

const assetSchema = new mongoose.Schema({
  assetType: {
    type: String,
    required: true,
    enum: ALL_ASSET_TYPES
  },

  department: {
    type: String,
    required: function () {
      return [...COMPUTER_ASSET_TYPES, ...PERIPHERAL_ASSET_TYPES].includes(this.assetType);
    },
    enum: ['Production', 'Maintenance', 'Commercial', 'Admin/HR', 'IT', ''],
    default: ''
  },

  username: {
    type: String,
    trim: true,
    default: ''
  },

  employeeCode: {
    type: String,
    trim: true,
    default: ''
  },
  assetCode: {
    type: String,
    trim: true,
    default: ''
  },

  hostname: {
    type: String,
    trim: true,
    default: ''
  },

  storage: {
    type: String,
    default: ''
  },

  ram: {
    type: String,
    default: ''
  },

  processor: {
    type: String,
    default: ''
  },
  
  serialNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },

  location: {
    type: String,
    trim: true,
    default: ''
  },

  status: {
    type: String,
    enum: ['Functional', 'Need Replacement', 'Not Functional', ''],
    default: 'Functional'
  },

  ipAddress: {
    type: String,
    trim: true,
    default: ''
  },

  model: {
    type: String,
    trim: true,
    default: ''
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

assetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
module.exports.COMPUTER_ASSET_TYPES = COMPUTER_ASSET_TYPES;
module.exports.PERIPHERAL_ASSET_TYPES = PERIPHERAL_ASSET_TYPES;
module.exports.NETWORK_ASSET_TYPES = NETWORK_ASSET_TYPES;
module.exports.ALL_ASSET_TYPES = ALL_ASSET_TYPES;