import TimeEntry from '../models/timeEntry.js';
import User from '../models/user.js';

// Clock in - create active time entry
export const clockIn = async (req, res) => {
  try {
    const { internId, internName } = req.body;

    // Check if intern already has an active time entry
    const existingActive = await TimeEntry.findOne({ internId, isActive: true });
    if (existingActive) {
      return res.status(400).json({ success: false, error: 'Already clocked in' });
    }

    const timeEntry = new TimeEntry({
      internId,
      internName,
      timeIn: new Date(),
      isActive: true,
      status: 'pending',
    });

    const saved = await timeEntry.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('clockIn error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Clock out - update active time entry
export const clockOut = async (req, res) => {
  try {
    const { internId } = req.body;

    // Find active time entry
    const activeEntry = await TimeEntry.findOne({ internId, isActive: true });
    if (!activeEntry) {
      return res.status(404).json({ success: false, error: 'No active time entry found' });
    }

    const timeOut = new Date();
    const duration = Math.floor((timeOut - activeEntry.timeIn) / 1000);

    const updated = await TimeEntry.findByIdAndUpdate(
      activeEntry._id,
      {
        timeOut,
        duration,
        isActive: false,
      },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('clockOut error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get current active time entry for an intern
export const getActiveTimeEntry = async (req, res) => {
  try {
    const { internId } = req.params;

    const activeEntry = await TimeEntry.findOne({ internId, isActive: true });
    
    if (!activeEntry) {
      return res.json({ success: true, data: null });
    }

    // Calculate current duration
    const now = new Date();
    const currentDuration = Math.floor((now - activeEntry.timeIn) / 1000);

    res.json({ 
      success: true, 
      data: {
        ...activeEntry.toObject(),
        currentDuration,
      }
    });
  } catch (err) {
    console.error('getActiveTimeEntry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create a new time entry (legacy, for manual entry)
export const createTimeEntry = async (req, res) => {
  try {
    const { internId, internName, timeIn, timeOut, duration } = req.body;

    const timeEntry = new TimeEntry({
      internId,
      internName,
      timeIn: new Date(timeIn),
      timeOut: new Date(timeOut),
      duration,
      isActive: false,
      status: 'pending',
    });

    const saved = await timeEntry.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('createTimeEntry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all time entries for an intern
export const getTimeEntriesByIntern = async (req, res) => {
  try {
    const { internId } = req.params;

    const timeEntries = await TimeEntry.find({ internId })
      .sort({ timeIn: -1 });

    res.json({ success: true, data: timeEntries });
  } catch (err) {
    console.error('getTimeEntriesByIntern error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all time entries (for secretary/admin)
export const getAllTimeEntries = async (req, res) => {
  try {
    const { status, internId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (internId) query.internId = internId;

    const timeEntries = await TimeEntry.find(query)
      .populate('internId', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ timeIn: -1 });

    res.json({ success: true, data: timeEntries });
  } catch (err) {
    console.error('getAllTimeEntries error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Approve a time entry
export const approveTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const reviewerId = req.user?._id || req.body.reviewedBy;

    const timeEntry = await TimeEntry.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes,
      },
      { new: true }
    );

    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({ success: true, data: timeEntry });
  } catch (err) {
    console.error('approveTimeEntry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reject a time entry
export const rejectTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const reviewerId = req.user?._id || req.body.reviewedBy;

    const timeEntry = await TimeEntry.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes,
      },
      { new: true }
    );

    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({ success: true, data: timeEntry });
  } catch (err) {
    console.error('rejectTimeEntry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all interns
export const getInterns = async (req, res) => {
  try {
    const interns = await User.find({ role: 'intern' })
      .select('_id firstName lastName email')
      .sort({ firstName: 1, lastName: 1 });

    res.json({ success: true, data: interns });
  } catch (err) {
    console.error('getInterns error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
