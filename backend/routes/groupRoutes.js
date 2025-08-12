// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
const Classroom = require('../models/Classroom');
const auth = require('../middleware/auth');

// Create a new group
router.post('/create', auth, async (req, res) => {
  console.log('Received request to create group:', req.body);

  const { classroomId, name, description, groupType } = req.body;
  let joinCode = null;

  try {
    if (!classroomId) {
      return res.status(400).json({ message: 'Please select a classroom before creating a group.' });
    }
    if (!name || !groupType) {
      return res.status(400).json({ message: 'Name and groupType are required.' });
    }

    const isPrivate = groupType === 'private';
    if (isPrivate) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const group = await Group.create({
      classroomId,
      name,
      description,
      groupType,
      isPrivate,
      joinCode,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    return res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    console.error('Group creation error:', err);
    return res.status(500).json({ message: 'Error creating group' });
  }
});

// Join a group (with or without code)

// helpers
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/groups/create
// Create a new group inside a classroom
router.post('/create', auth, async (req, res) => {
  const { classroomId, name, description, groupType } = req.body;

  // basic validation
  if (!classroomId) return res.status(400).json({ message: 'classroomId is required' });
  if (!isValidId(classroomId)) return res.status(400).json({ message: 'Invalid classroomId' });
  if (!name || !name.trim()) return res.status(400).json({ message: 'Group name is required' });
  if (!['public', 'private'].includes(groupType)) {
    return res.status(400).json({ message: "groupType must be 'public' or 'private'" });
  }

  try {
    // classroom must exist
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    // user must be part of the classroom (creator or member)
    const uid = req.user.id; // normalized in auth middleware
    const isCreator = classroom.createdBy?.toString() === uid;
    const isMember = classroom.members?.some((m) => m.toString() === uid);
    if (!isCreator && !isMember) {
      return res.status(403).json({ message: 'You are not part of this classroom' });
    }

    let joinCode = null;
    if (groupType === 'private') {
      joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    }

    const group = await Group.create({
      classroomId,
      name: name.trim(),
      description,
      groupType,
      joinCode,
      createdBy: uid,
      members: [uid],
    });

    return res.status(201).json({ message: 'Group created', group });
  } catch (err) {
    console.error('Group creation error:', err);
    // duplicate key (from { classroomId, name } unique index if you added it)
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Group name already exists in this classroom' });
    }
    return res.status(500).json({ message: 'Server error creating group' });
  }
});

// POST /api/groups/join
// Join a group (validates classroom membership and joinCode for private groups) main
router.post('/join', auth, async (req, res) => {
  const { groupId, joinCode } = req.body;

  if (!groupId) return res.status(400).json({ message: 'groupId is required' });
  if (!isValidId(groupId)) return res.status(400).json({ message: 'Invalid groupId' });

  try {
    const group = groupId ? await Group.findById(groupId) : await Group.findOne({ joinCode });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // if group tied to classroom, user must belong to that classroom
    if (group.classroomId) {
      const classroom = await Classroom.findById(group.classroomId);
      if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

      const uid = req.user.id;
      const inClass = classroom.createdBy?.toString() === uid ||
                      classroom.members?.some((m) => m.toString() === uid);
      if (!inClass) return res.status(403).json({ message: 'You are not part of this classroom' });
    }

    // private group requires correct join code
    if (group.groupType === 'private') {
      const normalized = String(joinCode || '').toUpperCase();
      if (!normalized || group.joinCode !== normalized) {
        return res.status(403).json({ message: 'Invalid group code' });
      }
    }

    const uid = req.user.id;
    const alreadyMember = group.members?.some((m) => m.toString() === uid);
    if (!alreadyMember) {
      group.members.push(uid);
      await group.save();
    }


    res.json({ message: 'Joined group successfully', group });

    return res.json({ message: 'Joined group successfully' });

  } catch (err) {
    console.error('Join group error:', err);
    return res.status(500).json({ message: 'Error joining group' });
  }
});

// Delete a group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this group' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ message: 'Error deleting group' });
  }
});

// Leave a group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ message: 'Error leaving group' });
  }
});

module.exports = router;
