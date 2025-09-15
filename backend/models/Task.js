const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true, maxlength: 200 }
}, { timestamps: true });

// Index for sorting performance on createdAt
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
