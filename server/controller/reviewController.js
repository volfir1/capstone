import Review from '../models/review.js'
import User from '../models/user.js'
import Attorney from '../models/attorney.js'
import Case from '../models/case.js'
import { createNotification } from './notificationController.js'
import { getIO } from '../socket.js'

export const createReview = async (req, res) => {
  try {
    const payload = req.body
    // extract denormalized readable fields when available
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null

    const toCreate = { ...payload }
    if (caseTitle) toCreate.caseTitle = caseTitle
    if (clientName) toCreate.clientName = clientName

    // If the case already has an assignee, copy it into the review so reviewers see assignment
    try {
      if (!toCreate.assignedTo && toCreate.caseId) {
        const c = await Case.findById(toCreate.caseId).select('assignedTo').lean();
        if (c && c.assignedTo) toCreate.assignedTo = c.assignedTo;
      }
    } catch (err) {
      console.warn('Could not copy case.assignedTo into review:', err.message);
    }

    const review = await Review.create(toCreate)
    
    // Return only essential fields to avoid serialization issues with large content
    // ── Notify the next reviewers (supervising_lawyer / director) ──
    if (review.reviewStage) {
      const roleToNotify = review.reviewStage; // e.g. 'supervising_lawyer' or 'director'
      // Find all users with that role in both collections
      const users = await User.find({ role: roleToNotify }).select('firebaseUid').lean();
      const attorneys = await Attorney.find({ role: roleToNotify }).select('firebaseUid').lean();
      const allRecipients = [...users, ...attorneys];
      const io = getIO();
      for (const r of allRecipients) {
        if (r.firebaseUid) {
          // Build a human-readable message without raw IDs
          const notifMessage = review.clientName
            ? `A case requires your review. Client: ${review.clientName}`
            : 'A case requires your review.';

          // Persistent notification
          createNotification({
            recipientId: r.firebaseUid,
            title: 'Review Pending',
            message: notifMessage,
            type: 'review_pending',
            referenceId: review.caseId,
          });
          // Real-time push via Socket.IO
          if (io) {
            // Push new-review event so dashboard updates without refresh
            io.to(r.firebaseUid).emit('new-review', {
              _id: review._id,
              caseId: review.caseId,
              caseTitle: review.caseTitle,
              clientName: review.clientName,
              reviewStage: review.reviewStage,
              step: review.step,
              createdAt: review.createdAt,
            });
            // Push notification event with payload so client can show a toast
            io.to(r.firebaseUid).emit('new-notification', {
              title: 'Review Pending',
              message: notifMessage,
              type: 'review_pending',
              referenceId: review.caseId,
            });
          }
        }
      }
    }

    const result = {
      _id: review._id,
      caseId: review.caseId,
      caseTitle: review.caseTitle,
      clientName: review.clientName,
      reviewerId: review.reviewerId,
      reviewerRole: review.reviewerRole,
      step: review.step,
      reviewStage: review.reviewStage,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      success: true
    }
    res.status(201).json(result)
  } catch (err) {
    console.error('createReview error:', err.name, err.message)
    if (err.errors) console.error('Validation errors:', JSON.stringify(err.errors))
    res.status(500).json({ error: err.message, name: err.name })
  }
}

export const getReviewsByCase = async (req, res) => {
  try {
    const { caseId } = req.params
    const reviews = await Review.find({ caseId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    console.error('getReviewsByCase error', err)
    res.status(500).json({ error: err.message })
  }
}

export const listAllReviews = async (req, res) => {
  try {
    const { role, reviewerId } = req.query
    const filter = {}
    if (role) filter.reviewerRole = role
    if (reviewerId) filter.reviewerId = reviewerId
    const reviews = await Review.find(filter).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    console.error('listAllReviews error', err)
    res.status(500).json({ error: err.message })
  }
}

export const deleteReviewByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params
    const result = await Review.deleteMany({ caseId })
    res.json({ success: true, deletedCount: result.deletedCount })
  } catch (err) {
    console.error('deleteReviewByCaseId error', err)
    res.status(500).json({ error: err.message })
  }
}

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body
    
    // extract denormalized readable fields when available
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null

    const toUpdate = { ...payload }
    if (caseTitle) toUpdate.caseTitle = caseTitle
    if (clientName) toUpdate.clientName = clientName

    // Fetch the old review to detect stage transitions
    const oldReview = await Review.findById(id).lean()
    const oldStage = oldReview?.reviewStage

    const updated = await Review.findByIdAndUpdate(id, toUpdate, { new: true })
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' })
    }

    // ── Send notifications on reviewStage transitions ──
    const newStage = updated.reviewStage
    if (newStage && newStage !== oldStage) {
      const reviewClientName = updated.clientName || clientName || ''
      const io = getIO()

      const notifyUsers = async (roles, title, message, type, { excludeUids = [] } = {}) => {
        const users = await User.find({ role: { $in: roles } }).select('firebaseUid').lean()
        const attorneys = await Attorney.find({ role: { $in: roles } }).select('firebaseUid').lean()
        const recipients = [...users, ...attorneys]
        for (const r of recipients) {
          if (!r.firebaseUid) continue
          // Skip recipients already notified individually (avoids duplicates)
          if (excludeUids.includes(r.firebaseUid)) continue
          createNotification({
            recipientId: r.firebaseUid,
            title,
            message,
            type,
            referenceId: updated.caseId,
          })
          if (io) {
            io.to(r.firebaseUid).emit('new-review', {
              _id: updated._id,
              caseId: updated.caseId,
              caseTitle: updated.caseTitle,
              clientName: updated.clientName,
              reviewStage: updated.reviewStage,
              step: updated.step,
              updatedAt: updated.updatedAt,
            })
            io.to(r.firebaseUid).emit('new-notification', {
              title,
              message,
              type,
              referenceId: updated.caseId,
            })
          }
        }
      }

      const notifyById = async (recipientId, title, message, type) => {
        if (!recipientId) return
        // Try both User and Attorney to find the firebaseUid
        let recipient = await User.findById(recipientId).select('firebaseUid').lean()
        if (!recipient) recipient = await Attorney.findById(recipientId).select('firebaseUid').lean()
        // Also try matching by firebaseUid directly
        if (!recipient) recipient = await User.findOne({ firebaseUid: recipientId }).select('firebaseUid').lean()
        if (!recipient) recipient = await Attorney.findOne({ firebaseUid: recipientId }).select('firebaseUid').lean()
        if (!recipient?.firebaseUid) return
        createNotification({
          recipientId: recipient.firebaseUid,
          title,
          message,
          type,
          referenceId: updated.caseId,
        })
        if (io) {
          io.to(recipient.firebaseUid).emit('new-review', {
            _id: updated._id,
            caseId: updated.caseId,
            caseTitle: updated.caseTitle,
            clientName: updated.clientName,
            reviewStage: updated.reviewStage,
            step: updated.step,
            updatedAt: updated.updatedAt,
          })
          io.to(recipient.firebaseUid).emit('new-notification', {
            title,
            message,
            type,
            referenceId: updated.caseId,
          })
        }
      }

      try {
        if (newStage === 'returned_to_intern') {
          // Supervising lawyer or director returned to intern — notify the original creator
          const msg = reviewClientName
            ? `A case has been returned for revision. Client: ${reviewClientName}`
            : 'A case has been returned for revision.'
          // Resolve the reviewer's firebaseUid so we can exclude them from the broadcast
          let reviewerUid = null
          if (updated.reviewerId) {
            await notifyById(updated.reviewerId, 'Case Returned for Revision', msg, 'review_returned')
            // Resolve the uid used by notifyById so we can skip them below
            let rUser = await User.findById(updated.reviewerId).select('firebaseUid').lean()
            if (!rUser) rUser = await Attorney.findById(updated.reviewerId).select('firebaseUid').lean()
            if (!rUser) rUser = await User.findOne({ firebaseUid: updated.reviewerId }).select('firebaseUid').lean()
            if (!rUser) rUser = await Attorney.findOne({ firebaseUid: updated.reviewerId }).select('firebaseUid').lean()
            reviewerUid = rUser?.firebaseUid || updated.reviewerId
          }
          // Also notify all interns and secretaries, but skip the reviewer already notified above
          await notifyUsers(['intern', 'secretary'], 'Case Returned for Revision', msg, 'review_returned', { excludeUids: reviewerUid ? [reviewerUid] : [] })
        } else if (newStage === 'supervising_lawyer' && oldStage === 'returned_to_intern') {
          // Intern resubmitted after revision — notify supervising lawyers
          const msg = reviewClientName
            ? `A revised case has been resubmitted for review. Client: ${reviewClientName}`
            : 'A revised case has been resubmitted for review.'
          await notifyUsers(['supervising_lawyer'], 'Revised Case Resubmitted', msg, 'review_resubmitted')
        } else if (newStage === 'supervising_lawyer' && oldStage === 'director') {
          // Director returned to supervising lawyer — notify supervising lawyers
          const msg = reviewClientName
            ? `A case has been returned by the Director for further review. Client: ${reviewClientName}`
            : 'A case has been returned by the Director for further review.'
          await notifyUsers(['supervising_lawyer'], 'Case Returned by Director', msg, 'review_returned')
        } else if (newStage === 'director' && oldStage === 'supervising_lawyer') {
          // Supervising lawyer approved to director — notify directors
          const msg = reviewClientName
            ? `A case has been forwarded for your approval. Client: ${reviewClientName}`
            : 'A case has been forwarded for your approval.'
          await notifyUsers(['director'], 'Case Ready for Approval', msg, 'review_pending')
        }
      } catch (notifErr) {
        // Never let notification failures break the main update flow
        console.error('Error sending review stage notification:', notifErr)
      }
    }

    res.json(updated)
  } catch (err) {
    console.error('updateReview error', err)
    res.status(500).json({ error: err.message })
  }
}

export const deleteReviewById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await Review.findByIdAndDelete(id)
    if (!result) {
      return res.status(404).json({ error: 'Review not found' })
    }
    res.json({ success: true, deletedReview: result })
  } catch (err) {
    console.error('deleteReviewById error', err)
    res.status(500).json({ error: err.message })
  }
}
