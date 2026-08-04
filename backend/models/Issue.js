const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  assetCode: { type: String, required: true, trim: true },
  serialNumber: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true, default: '' },
  department: { type: String, required: true, trim: true },
  assetType: { type: String, required: true, trim: true },
  issueDescription: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Open', 'Resolved'], default: 'Open' },
  repairRemark: { type: String, trim: true },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

issueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
