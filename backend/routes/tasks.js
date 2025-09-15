const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../models/Task');

// Utility: environment-aware error responses
const isProd = process.env.NODE_ENV === 'production';
const sendError = (res, err, status = 500, fallback = 'Internal server error') => {
  const message = isProd ? fallback : (err && err.message) ? err.message : fallback;
  return res.status(status).json({ error: message });
};

// GET / - list tasks with basic pagination
// Response shape standardized: { tasks: [...], meta: { total, page, limit, pages } }
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const maxLimit = 100;
    const defaultLimit = 50;
    let limit = parseInt(req.query.limit, 10) || defaultLimit;
    limit = Math.min(Math.max(limit, 1), maxLimit);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      // Use estimatedDocumentCount for performance; accurate enough for listing
      Task.estimatedDocumentCount(),
    ]);

    const pages = total ? Math.ceil(total / limit) : 0;

    return res.json({
      tasks,
      meta: {
        total,
        page,
        limit,
        pages,
      },
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST / - create a task with validation
// Response shape standardized: { task: {...} }
router.post('/', async (req, res) => {
  try {
    // Content-Type check supports json and +json variants
    if (!req.is(['application/json', 'json', '+json', 'application/*+json'])) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { text } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Task text must be a string' });
    }

    const cleaned = text.trim();
    if (!cleaned) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const maxLen = 200;
    if (cleaned.length > maxLen) {
      return res.status(400).json({ error: `Task text must be at most ${maxLen} characters` });
    }

    const newTask = new Task({ text: cleaned });
    await newTask.save();
    return res.status(201).json({ task: newTask });
  } catch (err) {
    return sendError(res, err);
  }
});

// DELETE /:id - delete a task with proper ID validation and status codes
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 204 No Content when deletion succeeds
    return res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

module.exports = router;
