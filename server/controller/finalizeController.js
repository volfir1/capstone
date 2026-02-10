import Finalize from '../models/finalize.js'
import User from '../models/user.js'
import { createNotification } from './notificationController.js'

export const createFinalize = async (req, res) => {
  try {
    const payload = req.body
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null

    const toCreate = { ...payload }
    // Remove caseId if it's "new-case" - let the model auto-generate it
    if (toCreate.caseId === 'new-case' || !toCreate.caseId) {
      delete toCreate.caseId
    }
    
    if (caseTitle) toCreate.caseTitle = caseTitle
    if (clientName) toCreate.clientName = clientName

    const rec = await Finalize.create(toCreate)
    console.log('Created finalize record with caseId:', rec.caseId)

    // ── Notify client if decision was made ──
    if (rec.clientUserId) {
      const client = await User.findById(rec.clientUserId);
      if (client?.firebaseUid && rec.decision) {
        const isAccepted = rec.decision === 'accepted';
        createNotification({
          recipientId: client.firebaseUid,
          title: isAccepted ? 'Case Accepted' : rec.decision === 'rejected' ? 'Case Update' : 'Case Under Review',
          message: isAccepted
            ? `Your case "${rec.caseTitle || rec.caseId}" has been accepted.`
            : rec.decision === 'rejected'
            ? `Your case "${rec.caseTitle || rec.caseId}" was not accepted. Please contact the office for details.`
            : `Your case "${rec.caseTitle || rec.caseId}" is being reviewed.`,
          type: isAccepted ? 'case_accepted' : 'case_rejected',
          referenceId: rec._id.toString(),
        });
      }
    }

    res.status(201).json(rec)
  } catch (err) {
    console.error('createFinalize error', err)
    res.status(500).json({ error: err.message })
  }
}

export const listFinalized = async (req, res) => {
  try {
    const items = await Finalize.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    console.error('listFinalized error', err)
    res.status(500).json({ error: err.message })
  }
}

export const updateFinalized = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body
    
    // Update denormalized fields
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null
    const decision = payload?.content?.actionInfo?.decision || payload.decision || null

    const toUpdate = { ...payload }
    if (caseTitle) toUpdate.caseTitle = caseTitle
    if (clientName) toUpdate.clientName = clientName
    if (decision) toUpdate.decision = decision

    const oldDoc = await Finalize.findById(id);
    const updated = await Finalize.findByIdAndUpdate(id, toUpdate, { new: true })
    if (!updated) {
      return res.status(404).json({ error: 'Finalized record not found' })
    }

    // ── Notify client if decision just changed ──
    if (decision && oldDoc && decision !== oldDoc.decision && updated.clientUserId) {
      const client = await User.findById(updated.clientUserId);
      if (client?.firebaseUid) {
        const isAccepted = decision === 'accepted';
        createNotification({
          recipientId: client.firebaseUid,
          title: isAccepted ? 'Case Accepted' : 'Case Update',
          message: isAccepted
            ? `Your case "${updated.caseTitle || updated.caseId}" has been accepted.`
            : `Your case "${updated.caseTitle || updated.caseId}" status has been updated to: ${decision}.`,
          type: isAccepted ? 'case_accepted' : 'case_rejected',
          referenceId: id,
        });
      }
    }

    res.json(updated)
  } catch (err) {
    console.error('updateFinalized error', err)
    res.status(500).json({ error: err.message })
  }
}

export const getFinalizeByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params
    console.log('Fetching finalize document for caseId:', caseId)
    
    const finalize = await Finalize.findOne({ caseId })
    if (!finalize) {
      console.log('No finalize document found for caseId:', caseId)
      return res.status(404).json({ error: 'Finalize record not found' })
    }
    
    console.log('Found finalize document:', finalize._id)
    res.json(finalize)
  } catch (err) {
    console.error('getFinalizeByCaseId error', err)
    res.status(500).json({ error: err.message })
  }
}

// Get finalized cases for a specific user (client accounts created by admin)
export const getFinalizedByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('Fetching finalized cases for userId:', userId)
    
    const finalizedCases = await Finalize.find({ 
      clientUserId: userId,
      decision: 'accepted' 
    }).sort({ createdAt: -1 })
    
    console.log('Found', finalizedCases.length, 'finalized cases for user')
    res.json(finalizedCases)
  } catch (err) {
    console.error('getFinalizedByUserId error', err)
    res.status(500).json({ error: err.message })
  }
}
