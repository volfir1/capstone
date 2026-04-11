import CaseAssignment from '../models/caseAssignment.js';
import Finalize from '../models/finalize.js';
import User from '../models/user.js';
import {
  createNotification,
  emitNotificationToProfile,
  emitSocketEventToProfile,
} from './notificationController.js';
import { safeErrorMessage } from '../utils/errorResponse.js';

const getUserFromRequest = (req) => req.activeProfile || null;

// —— POST /case-assignments — Create a new assignment (director/secretary only) ——
export const createCaseAssignment = async (req, res) => {
  try {
    const assigner = getUserFromRequest(req);
    if (!assigner) return res.status(401).json({ error: 'Unauthorized' });

    // Only director and secretary can assign
    if (!['director', 'secretary'].includes(assigner.role)) {
      return res.status(403).json({ error: 'Only directors and secretaries can assign cases' });
    }

    const { finalizeId, assigneeId, deadline, message } = req.body;
    if (!finalizeId || !assigneeId || !deadline || !message) {
      return res.status(400).json({
        error: 'finalizeId, assigneeId, deadline, and message are required',
      });
    }

    // Find the finalize record
    const finalize = await Finalize.findById(finalizeId).lean();
    if (!finalize) return res.status(404).json({ error: 'Finalized case not found' });

    // Find the assignee
    let assignee = null;
    try {
      assignee = await User.findOne({
        _id: assigneeId,
        ...(req.account?._id ? { accountId: req.account._id } : {}),
      }).lean();
    } catch (e) {
      // ignore and try fallback lookup
    }
    if (!assignee) {
      assignee = await User.findOne({
        $or: [{ firebaseUid: assigneeId }, { email: assigneeId }],
        ...(req.account?._id ? { accountId: req.account._id } : {}),
      }).lean();
    }
    if (!assignee) return res.status(404).json({ error: 'Assignee not found' });

    const assigneeProfileId = assignee._id.toString();
    const assignerProfileId = assigner._id.toString();

    const assignment = await CaseAssignment.create({
      finalizeId: finalize._id,
      caseId: finalize.caseId,
      caseTitle: finalize.caseTitle,
      clientName: finalize.clientName,
      category: finalize.category,
      caseType: finalize.content?.interviewInfo?.caseType || '',
      assignedTo: {
        id: assigneeProfileId,
        name: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email,
        email: assignee.email,
        role: assignee.role,
        firebaseUid: assignee.firebaseUid,
      },
      assignedBy: {
        id: assignerProfileId,
        name: `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.email,
        email: assigner.email,
        role: assigner.role,
      },
      deadline: new Date(deadline),
      message,
    });

    // Create notification for the assignee
    const notification = await createNotification({
      recipientId: assigneeProfileId,
      title: 'New Case Assignment',
      message: `You have been assigned to case "${finalize.caseTitle || finalize.caseId}". Deadline: ${new Date(deadline).toLocaleDateString()}`,
      type: 'case_assigned',
      referenceId: assignment._id.toString(),
    });

    if (notification) {
      emitNotificationToProfile(assigneeProfileId, notification);
    }

    // Notify both parties to refresh their assignment lists
    emitSocketEventToProfile(assigneeProfileId, 'assignment-updated');
    emitSocketEventToProfile(assignerProfileId, 'assignment-updated');

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error('createCaseAssignment error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— GET /case-assignments/mine — Assignments assigned TO the current user ——
export const getMyAssignments = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = user._id.toString();
    const assignments = await CaseAssignment.find({ 'assignedTo.id': userId })
      .sort({ createdAt: -1 })
      .lean();

    // Backfill caseType for old assignments that don't have it
    const needBackfill = assignments.filter((assignment) => !assignment.caseType);
    if (needBackfill.length > 0) {
      const finalizeIds = [
        ...new Set(needBackfill.map((assignment) => assignment.finalizeId).filter(Boolean)),
      ];
      if (finalizeIds.length > 0) {
        const finalizes = await Finalize.find({ _id: { $in: finalizeIds } })
          .select('content.interviewInfo.caseType')
          .lean();
        const typeMap = {};
        for (const finalize of finalizes) {
          typeMap[finalize._id.toString()] = finalize.content?.interviewInfo?.caseType || '';
        }
        for (const assignment of assignments) {
          if (!assignment.caseType && assignment.finalizeId) {
            assignment.caseType = typeMap[assignment.finalizeId.toString()] || '';
          }
        }
        // Persist so we don't re-query next time
        const bulkOps = needBackfill
          .filter((assignment) => assignment.caseType)
          .map((assignment) => ({
            updateOne: {
              filter: { _id: assignment._id },
              update: { caseType: assignment.caseType },
            },
          }));
        if (bulkOps.length > 0) CaseAssignment.bulkWrite(bulkOps).catch(() => {});
      }
    }

    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('getMyAssignments error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— GET /case-assignments/assigned-by-me — Assignments created BY the current user ——
export const getAssignedByMe = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const assignments = await CaseAssignment.find({ 'assignedBy.id': user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    // Backfill caseType for old assignments that don't have it
    const needBackfill = assignments.filter((assignment) => !assignment.caseType);
    if (needBackfill.length > 0) {
      const finalizeIds = [
        ...new Set(needBackfill.map((assignment) => assignment.finalizeId).filter(Boolean)),
      ];
      if (finalizeIds.length > 0) {
        const finalizes = await Finalize.find({ _id: { $in: finalizeIds } })
          .select('content.interviewInfo.caseType')
          .lean();
        const typeMap = {};
        for (const finalize of finalizes) {
          typeMap[finalize._id.toString()] = finalize.content?.interviewInfo?.caseType || '';
        }
        for (const assignment of assignments) {
          if (!assignment.caseType && assignment.finalizeId) {
            assignment.caseType = typeMap[assignment.finalizeId.toString()] || '';
          }
        }
        // Persist so we don't re-query next time
        const bulkOps = needBackfill
          .filter((assignment) => assignment.caseType)
          .map((assignment) => ({
            updateOne: {
              filter: { _id: assignment._id },
              update: { caseType: assignment.caseType },
            },
          }));
        if (bulkOps.length > 0) CaseAssignment.bulkWrite(bulkOps).catch(() => {});
      }
    }

    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('getAssignedByMe error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— PUT /case-assignments/:id/complete — Mark as done ——
export const completeCaseAssignment = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const assignment = await CaseAssignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Only the assignee can mark as done
    const userId = user._id.toString();
    if (assignment.assignedTo.id !== userId) {
      return res.status(403).json({ error: 'Only the assigned person can mark as done' });
    }

    assignment.status = 'done';
    assignment.completedAt = new Date();
    await assignment.save();

    const assignerProfileId = assignment.assignedBy?.id || '';
    const assigneeProfileId = assignment.assignedTo?.id || '';

    // Notify the assigner that it's been completed
    if (assignerProfileId) {
      const notification = await createNotification({
        recipientId: assignerProfileId,
        title: 'Assignment Completed',
        message: `${assignment.assignedTo.name} has completed the assignment for case "${assignment.caseTitle || assignment.caseId}"`,
        type: 'case_assigned',
        referenceId: assignment._id.toString(),
      });

      if (notification) {
        emitNotificationToProfile(assignerProfileId, notification);
      }
      emitSocketEventToProfile(assignerProfileId, 'assignment-updated');
    }

    if (assigneeProfileId) {
      emitSocketEventToProfile(assigneeProfileId, 'assignment-updated');
    }

    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error('completeCaseAssignment error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— PUT /case-assignments/:id/undo — Undo mark as done (set back to pending) ——
export const undoCaseAssignment = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const assignment = await CaseAssignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const userId = user._id.toString();
    if (assignment.assignedTo.id !== userId) {
      return res.status(403).json({ error: 'Only the assigned person can undo completion' });
    }

    assignment.status = 'pending';
    assignment.completedAt = null;
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error('undoCaseAssignment error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— DELETE /case-assignments/:id — Delete an assignment ——
export const deleteCaseAssignment = async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Only director and secretary can delete
    if (!['director', 'secretary'].includes(user.role)) {
      return res.status(403).json({ error: 'Only directors and secretaries can delete assignments' });
    }

    const { id } = req.params;
    const deleted = await CaseAssignment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });

    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    console.error('deleteCaseAssignment error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

// —— GET /case-assignments/admin-staff — Get eligible admin staff for assignment ——
export const getAdminStaff = async (req, res) => {
  try {
    const roles = ['director', 'secretary', 'supervising_lawyer', 'intern'];
    const users = await User.find({
      role: { $in: roles },
      disabled: { $ne: true },
      ...(req.account?._id ? { accountId: req.account._id } : {}),
    })
      .select('firstName lastName email role firebaseUid')
      .sort({ role: 1, firstName: 1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('getAdminStaff error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};
