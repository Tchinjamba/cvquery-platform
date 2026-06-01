const mongoose = require('mongoose');
const CVSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:  { type: String, required: true, trim: true },
  data:  { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
module.exports = mongoose.model('CV', CVSchema);
