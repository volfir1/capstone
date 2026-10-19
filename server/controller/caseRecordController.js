import CaseRecord from '../models/caserecord.js'
import CaseAssignment from '../models/caseAssignment.js'
import Finalize from '../models/finalize.js'
import { safeErrorMessage } from '../utils/errorResponse.js'
import { emitSocketEventToProfile } from './notificationController.js'
import fs from 'fs'
import path from 'path'

// Create or Update Case Record
export const upsertCaseRecord = async (req, res) => {
  try {
    const { finalizeId } = req.params
    const payload = req.body

    console.log('Upserting case record for finalizeId:', finalizeId)
    console.log('Payload keys:', Object.keys(payload))
    console.log('courtVenueDetails:', payload.courtVenueDetails?.length || 0, 'entries')
    console.log('partiesAndCounselDetails:', payload.partiesAndCounselDetails?.length || 0, 'groups')
    console.log('evidence lists:', payload.evidence?.length || 0, 'lists')

    if (!finalizeId) {
      return res.status(400).json({ error: 'finalizeId is required' })
    }

    // Check if finalize record exists
    const finalizeRecord = await Finalize.findById(finalizeId)
    if (!finalizeRecord) {
      console.log('Finalized case not found for finalizeId:', finalizeId)
      return res.status(404).json({ error: 'Finalized case not found' })
    }

    console.log('Finalize record found:', { id: finalizeRecord._id, decision: finalizeRecord.decision, caseId: finalizeRecord.caseId })

    // Check if case is accepted
    if (finalizeRecord.decision !== 'accepted') {
      console.log('Case is not accepted, decision:', finalizeRecord.decision)
      return res.status(403).json({ error: 'Case record can only be created for accepted cases' })
    }

    // Prepare the payload with evidence data
    const updatePayload = {
      ...payload,
      finalizeId: finalizeRecord._id,
      caseId: finalizeRecord.caseId,
      lastModifiedBy: req.user?.uid || req.body.lastModifiedBy,
    }

    // Find and update or create new
    const caseRecord = await CaseRecord.findOneAndUpdate(
      { finalizeId: finalizeRecord._id },
      updatePayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )

    // Also update the finalize content.caseInfo for consistency
    if (!finalizeRecord.content) finalizeRecord.content = {}
    finalizeRecord.content.caseInfo = payload
    if (payload?.title || payload?.caseTitle) {
      finalizeRecord.caseTitle = payload.title || payload.caseTitle
    }
    finalizeRecord.markModified('content') // Explicitly mark as modified for Mixed type
    await finalizeRecord.save()

    // Also update caseTitle in any existing case assignments for this finalize record
    if (payload?.title || payload?.caseTitle) {
      const affected = await CaseAssignment.find({ finalizeId: finalizeRecord._id }).select('assignedTo assignedBy').lean()
      await CaseAssignment.updateMany(
        { finalizeId: finalizeRecord._id },
        { caseTitle: payload.title || payload.caseTitle }
      )
      // Notify all involved users so their lists auto-refresh
      if (affected.length) {
        const profileIds = new Set()
        affected.forEach(a => {
          if (a.assignedTo?.id) profileIds.add(a.assignedTo.id)
          if (a.assignedBy?.id) profileIds.add(a.assignedBy.id)
        })
        profileIds.forEach((profileId) => emitSocketEventToProfile(profileId, 'assignment-updated'))
      }
    }

    console.log('Case record saved:', { finalizeId, recordId: caseRecord._id, evidenceCount: caseRecord.evidence?.length || 0 })

    res.json({
      success: true,
      data: caseRecord,
      message: 'Case record saved successfully'
    })
  } catch (err) {
    console.error('upsertCaseRecord error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Get Case Record by caseId
export const getCaseRecord = async (req, res) => {
  try {
    const { caseId } = req.params

    const caseRecord = await CaseRecord.findOne({ caseId }).populate('finalizeId')
    
      if (!caseRecord) {
        // Return null for not-found so frontend can distinguish absence without triggering HTTP error
        return res.json(null)
      }

      return res.json(caseRecord)
  } catch (err) {
    console.error('getCaseRecord error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Get All Case Records
export const listCaseRecords = async (req, res) => {
  try {
    const { limit = 50, skip = 0, search } = req.query
    
    let query = {}
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { nature: { $regex: search, $options: 'i' } },
          { parties: { $regex: search, $options: 'i' } }
        ]
      }
    }

    const caseRecords = await CaseRecord.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('finalizeId')

    const total = await CaseRecord.countDocuments(query)

    res.json({
      data: caseRecords,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    })
  } catch (err) {
    console.error('listCaseRecords error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Update Case Record
export const updateCaseRecord = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body

    const caseRecord = await CaseRecord.findByIdAndUpdate(
      id,
      {
        ...payload,
        lastModifiedBy: req.user?.uid || req.body.lastModifiedBy,
      },
      { new: true, runValidators: true }
    )

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case record not found' })
    }

    // Update finalize content.caseInfo as well
    const finalizeRecord = await Finalize.findById(caseRecord.finalizeId)
    if (finalizeRecord) {
      if (!finalizeRecord.content) finalizeRecord.content = {}
      finalizeRecord.content.caseInfo = payload
      if (payload?.title || payload?.caseTitle) {
        finalizeRecord.caseTitle = payload.title || payload.caseTitle
      }
      finalizeRecord.markModified('content')
      await finalizeRecord.save()
    }

    res.json({
      success: true,
      data: caseRecord,
      message: 'Case record updated successfully'
    })
  } catch (err) {
    console.error('updateCaseRecord error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Delete Case Record
export const deleteCaseRecord = async (req, res) => {
  try {
    const { id } = req.params

    const caseRecord = await CaseRecord.findByIdAndDelete(id)

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case record not found' })
    }

    // Optionally remove from finalize content
    const finalizeRecord = await Finalize.findById(caseRecord.finalizeId)
    if (finalizeRecord && finalizeRecord.content) {
      delete finalizeRecord.content.caseInfo
      await finalizeRecord.save()
    }

    res.json({
      success: true,
      message: 'Case record deleted successfully'
    })
  } catch (err) {
    console.error('deleteCaseRecord error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Bulk-check which finalizeIds have a case record (eliminates N+1 on FinalizedCases page)
export const getBulkCaseRecordsByFinalizeIds = async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true, data: {} })
    }
    // Only fetch _id + finalizeId — no need for full documents
    const records = await CaseRecord.find({ finalizeId: { $in: ids } }).select('finalizeId')
    const resultMap = {}
    ids.forEach(id => { resultMap[id] = false })
    records.forEach(r => { resultMap[r.finalizeId.toString()] = true })
    return res.json({ success: true, data: resultMap })
  } catch (err) {
    console.error('getBulkCaseRecordsByFinalizeIds error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Get Case Record by Finalize ID
export const getCaseRecordByFinalizeId = async (req, res) => {
  try {
    const { finalizeId } = req.params

    const caseRecord = await CaseRecord.findOne({ finalizeId }).populate('finalizeId')

      if (!caseRecord) {
        // Return null when no case record exists for this finalize id
        return res.json(null)
      }

      return res.json(caseRecord)
  } catch (err) {
    console.error('getCaseRecordByFinalizeId error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Get Evidence only (for performance when only evidence is needed)
export const getEvidenceByFinalizeId = async (req, res) => {
  try {
    const { finalizeId } = req.params

    const caseRecord = await CaseRecord.findOne({ finalizeId }).select('evidence')

    if (!caseRecord) {
      return res.json({ evidence: [] })
    }

    return res.json({ evidence: caseRecord.evidence || [] })
  } catch (err) {
    console.error('getEvidenceByFinalizeId error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Upload a draft file
export const uploadDraft = async (req, res) => {
  try {
    const { finalizeId } = req.params
    const { fileData } = req.body // fileData should contain Cloudinary response from frontend

    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' })
    }

    // Find or create case record
    let caseRecord = await CaseRecord.findOne({ finalizeId })
    if (!caseRecord) {
      // Create case record if it doesn't exist
      const finalizeRecord = await Finalize.findById(finalizeId)
      if (!finalizeRecord) {
        return res.status(404).json({ error: 'Finalized case not found' })
      }

      caseRecord = new CaseRecord({
        finalizeId: finalizeRecord._id,
        caseId: finalizeRecord.caseId,
        drafts: []
      })
    }

    // Initialize drafts array if it doesn't exist
    if (!caseRecord.drafts) {
      caseRecord.drafts = []
    }

    // Add draft to array with Cloudinary data
    const draft = {
      id: Date.now().toString(),
      fileName: fileData.originalName || fileData.displayName,
      fileType: fileData.mimetype,
      fileSize: fileData.size,
      filename: fileData.filename,
      cloudinaryUrl: fileData.cloudinaryUrl || fileData.url,
      cloudinaryPublicId: fileData.cloudinaryPublicId,
      cloudinaryResourceType: fileData.cloudinaryResourceType,
      uploadedAt: new Date(),
      uploadedBy: req.user?.uid || req.body.uploadedBy || 'unknown'
    }

    caseRecord.drafts.push(draft)
    await caseRecord.save()

    res.json({
      success: true,
      data: draft,
      message: 'Draft uploaded successfully'
    })
  } catch (err) {
    console.error('uploadDraft error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// List all drafts for a case record
export const listDrafts = async (req, res) => {
  try {
    const { finalizeId } = req.params

    const caseRecord = await CaseRecord.findOne({ finalizeId }).select('drafts')

    if (!caseRecord) {
      return res.json({ drafts: [] })
    }

    return res.json({ drafts: caseRecord.drafts || [] })
  } catch (err) {
    console.error('listDrafts error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}

// Delete a draft file
export const deleteDraft = async (req, res) => {
  try {
    const { finalizeId, draftId } = req.params

    const caseRecord = await CaseRecord.findOne({ finalizeId })
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case record not found' })
    }

    const draftIndex = caseRecord.drafts?.findIndex(d => d.id === draftId)
    if (draftIndex === -1) {
      return res.status(404).json({ error: 'Draft not found' })
    }

    const draft = caseRecord.drafts[draftIndex]

    // Delete from Cloudinary if Cloudinary data exists
    if (draft.cloudinaryPublicId) {
      try {
        const { deleteFromCloudinary } = await import('../server.js')
        await deleteFromCloudinary(draft.cloudinaryPublicId, draft.cloudinaryResourceType || 'auto')
      } catch (cloudErr) {
        console.warn('Failed to delete from Cloudinary:', cloudErr.message)
      }
    }

    // Remove draft from array
    caseRecord.drafts.splice(draftIndex, 1)
    await caseRecord.save()

    res.json({
      success: true,
      message: 'Draft deleted successfully'
    })
  } catch (err) {
    console.error('deleteDraft error', err)
    res.status(500).json({ error: safeErrorMessage(err)})
  }
}
