import mongoose from 'mongoose';

import Review from '../models/review.js';
import User from '../models/user.js';
import Case from '../models/case.js';
import {
  createNotification,
  emitNotificationToProfile,
  emitSocketEventToProfile,
  listActiveProfilesByRoles,
} from './notificationController.js';
import { safeErrorMessage } from '../utils/errorResponse.js';

const resolveProfileRecipient = async (recipientId, accountId = null) => {
  const normalizedRecipientId = String(recipientId || '').trim();
  if (!normalizedRecipientId) return null;

  if (mongoose.Types.ObjectId.isValid(normalizedRecipientId)) {
    const profile = await User.findOne({
      _id: normalizedRecipientId,
      ...(accountId ? { accountId } : {}),
      disabled: { $ne: true },
    })
      .select('_id')
      .lean();

    if (profile?._id) return profile;
  }

  return User.findOne({
    firebaseUid: normalizedRecipientId,
    ...(accountId ? { accountId } : {}),
    disabled: { $ne: true },
  })
    .select('_id')
    .lean();
};

const emitReviewStateForProfile = (profileId, review, dateField = 'updatedAt') => {
  emitSocketEventToProfile(profileId, 'new-review', {
    _id: review._id,
    caseId: review.caseId,
    caseTitle: review.caseTitle,
    clientName: review.clientName,
    reviewStage: review.reviewStage,
    step: review.step,
    [dateField]: review[dateField],
  });
};

export const createReview = async (req, res) => {
  try {
    const payload = req.body;
    // extract denormalized readable fields when available
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null;
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null;

    const toCreate = { ...payload };
    if (caseTitle) toCreate.caseTitle = caseTitle;
    if (clientName) toCreate.clientName = clientName;

    // If the case already has an assignee, copy it into the review so reviewers see assignment
    try {
      if (!toCreate.assignedTo && toCreate.caseId) {
        const caseData = await Case.findById(toCreate.caseId).select('assignedTo').lean();
        if (caseData?.assignedTo) toCreate.assignedTo = caseData.assignedTo;
      }
    } catch (err) {
      console.warn('Could not copy case.assignedTo into review:', err.message);
    }

    // Prevent duplicate reviews for the same caseId — update existing instead of creating new
    if (toCreate.caseId) {
      const existing = await Review.findOne({ caseId: toCreate.caseId });
      if (existing) {
        const updated = await Review.findByIdAndUpdate(existing._id, toCreate, { new: true });
        return res.status(200).json({
          _id: updated._id,
          caseId: updated.caseId,
          caseTitle: updated.caseTitle,
          clientName: updated.clientName,
          reviewerId: updated.reviewerId,
          reviewerRole: updated.reviewerRole,
          step: updated.step,
          reviewStage: updated.reviewStage,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          success: true,
        });
      }
    }

    const review = await Review.create(toCreate);

    // Return only essential fields to avoid serialization issues with large content
    // Notify the next reviewers (supervising_lawyer / director)
    if (review.reviewStage) {
      const recipients = await listActiveProfilesByRoles(review.reviewStage, {
        accountId: req.account?._id || null,
      });

      for (const recipient of recipients) {
        const recipientProfileId = recipient._id.toString();
        const notifMessage = review.clientName
          ? `A case requires your review. Client: ${review.clientName}`
          : 'A case requires your review.';

        const notification = await createNotification({
          recipientId: recipientProfileId,
          title: 'Review Pending',
          message: notifMessage,
          type: 'review_pending',
          referenceId: review.caseId,
        });

        emitReviewStateForProfile(recipientProfileId, review, 'createdAt');
        if (notification) {
          emitNotificationToProfile(recipientProfileId, notification);
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
      success: true,
    };
    res.status(201).json(result);
  } catch (err) {
    console.error('createReview error:', err.name, err.message);
    if (err.errors) console.error('Validation errors:', JSON.stringify(err.errors));
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

export const getReviewsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const reviews = await Review.find({ caseId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('getReviewsByCase error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

export const listAllReviews = async (req, res) => {
  try {
    const { role, reviewerId } = req.query;
    const filter = {};
    if (role) filter.reviewerRole = role;
    if (reviewerId) filter.reviewerId = reviewerId;
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('listAllReviews error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

export const deleteReviewByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const result = await Review.deleteMany({ caseId });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('deleteReviewByCaseId error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // extract denormalized readable fields when available
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null;
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null;

    const toUpdate = { ...payload };
    if (caseTitle) toUpdate.caseTitle = caseTitle;
    if (clientName) toUpdate.clientName = clientName;

    // Fetch the old review to detect stage transitions
    const oldReview = await Review.findById(id).lean();
    const oldStage = oldReview?.reviewStage;

    const updated = await Review.findByIdAndUpdate(id, toUpdate, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Send notifications on reviewStage transitions
    const newStage = updated.reviewStage;
    if (newStage && newStage !== oldStage) {
      const reviewClientName = updated.clientName || clientName || '';
      const notificationAccountId = req.account?._id || null;

      const notifyUsers = async (
        roles,
        title,
        message,
        type,
        { excludeProfileIds = [] } = {}
      ) => {
        const recipients = await listActiveProfilesByRoles(roles, {
          accountId: notificationAccountId,
        });

        for (const recipient of recipients) {
          const recipientProfileId = recipient._id.toString();
          if (excludeProfileIds.includes(recipientProfileId)) continue;

          const notification = await createNotification({
            recipientId: recipientProfileId,
            title,
            message,
            type,
            referenceId: updated.caseId,
          });

          emitReviewStateForProfile(recipientProfileId, updated);
          if (notification) {
            emitNotificationToProfile(recipientProfileId, notification);
          }
        }
      };

      const notifyById = async (recipientId, title, message, type) => {
        if (!recipientId) return '';

        const recipient = await resolveProfileRecipient(recipientId, notificationAccountId);
        if (!recipient?._id) return '';

        const recipientProfileId = recipient._id.toString();
        const notification = await createNotification({
          recipientId: recipientProfileId,
          title,
          message,
          type,
          referenceId: updated.caseId,
        });

        emitReviewStateForProfile(recipientProfileId, updated);
        if (notification) {
          emitNotificationToProfile(recipientProfileId, notification);
        }

        return recipientProfileId;
      };

      try {
        if (newStage === 'returned_to_intern') {
          // Supervising lawyer or director returned to intern — notify the original creator
          const msg = reviewClientName
            ? `A case has been returned for revision. Client: ${reviewClientName}`
            : 'A case has been returned for revision.';

          let reviewerProfileId = '';
          if (updated.reviewerId) {
            reviewerProfileId = await notifyById(
              updated.reviewerId,
              'Case Returned for Revision',
              msg,
              'review_returned'
            );
          }

          // Also notify all interns and secretaries, but skip the reviewer already notified above
          await notifyUsers(
            ['intern', 'secretary'],
            'Case Returned for Revision',
            msg,
            'review_returned',
            { excludeProfileIds: reviewerProfileId ? [reviewerProfileId] : [] }
          );
        } else if (newStage === 'supervising_lawyer' && oldStage === 'returned_to_intern') {
          // Intern resubmitted after revision — notify supervising lawyers
          const msg = reviewClientName
            ? `A revised case has been resubmitted for review. Client: ${reviewClientName}`
            : 'A revised case has been resubmitted for review.';
          await notifyUsers(
            ['supervising_lawyer'],
            'Revised Case Resubmitted',
            msg,
            'review_resubmitted'
          );
        } else if (newStage === 'supervising_lawyer' && oldStage === 'director') {
          // Director returned to supervising lawyer — notify supervising lawyers
          const msg = reviewClientName
            ? `A case has been returned by the Director for further review. Client: ${reviewClientName}`
            : 'A case has been returned by the Director for further review.';
          await notifyUsers(
            ['supervising_lawyer'],
            'Case Returned by Director',
            msg,
            'review_returned'
          );
        } else if (newStage === 'director' && oldStage === 'supervising_lawyer') {
          // Supervising lawyer approved to director — notify directors
          const msg = reviewClientName
            ? `A case has been forwarded for your approval. Client: ${reviewClientName}`
            : 'A case has been forwarded for your approval.';
          await notifyUsers(['director'], 'Case Ready for Approval', msg, 'review_pending');
        }
      } catch (notifErr) {
        // Never let notification failures break the main update flow
        console.error('Error sending review stage notification:', notifErr);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('updateReview error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};

export const deleteReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Review.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true, deletedReview: result });
  } catch (err) {
    console.error('deleteReviewById error', err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
};
