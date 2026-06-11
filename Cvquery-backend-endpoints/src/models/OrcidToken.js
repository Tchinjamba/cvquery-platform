// backend/src/models/OrcidToken.js
const mongoose = require('mongoose');

const OrcidTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orcidId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  scope: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrcidToken', OrcidTokenSchema);