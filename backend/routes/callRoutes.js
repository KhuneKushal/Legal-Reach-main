import express from 'express';
import Call from '../models/Call.js';
import User from '../models/user.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/calls/initiate — Create a new call record
router.post('/initiate', protect, async (req, res) => {
  try {
    const { receiverId, callType, roomId } = req.body;
    const callerId = req.user._id || req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      status: 'pending',
      startTime: new Date()
    });

    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'name email')
      .populate('receiver', 'name email');

    res.status(201).json({ success: true, call: populatedCall });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/calls/:id/accept — Accept a call
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const myId = req.user._id || req.user.id;
    if (call.receiver.toString() !== myId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    call.status = 'accepted';
    await call.save();

    res.json({ success: true, call });
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/calls/:id/reject — Reject a call
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const myId = req.user._id || req.user.id;
    if (call.receiver.toString() !== myId.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    call.status = 'rejected';
    call.endTime = new Date();
    await call.save();

    res.json({ success: true, call });
  } catch (error) {
    console.error('Reject call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/calls/:id/end — End a call
router.put('/:id/end', protect, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    call.status = 'ended';
    call.endTime = new Date();
    await call.save();

    res.json({ success: true, call });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calls/history — Get call history for the logged-in user
router.get('/history', protect, async (req, res) => {
  try {
    const myId = req.user._id || req.user.id;

    const calls = await Call.find({
      $or: [{ caller: myId }, { receiver: myId }]
    })
      .populate('caller', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(calls);
  } catch (error) {
    console.error('Call history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;