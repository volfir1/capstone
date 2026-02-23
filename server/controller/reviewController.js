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
          // Persistent notification
          createNotification({
            recipientId: r.firebaseUid,
            title: 'Review Pending',
            message: `Case "${review.caseTitle || review.caseId}" requires your review.${review.clientName ? ` Client: ${review.clientName}` : ''}`,
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
            // Push notification event so bell updates instantly
            io.to(r.firebaseUid).emit('new-notification');
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

    const updated = await Review.findByIdAndUpdate(id, toUpdate, { new: true })
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' })
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
