import CaseRecord from '../models/caserecord.js'
import CaseAssignment from '../models/caseAssignment.js'
import Finalize from '../models/finalize.js'
import { safeErrorMessage } from '../utils/errorResponse.js'

// Create or Update Case Record
export const upsertCaseRecord = async (req, res) => {
  try {
    const { finalizeId } = req.params
    const payload = req.body
    
    console.log('Upserting case record for finalizeId:', finalizeId)
    console.log('Payload:', payload)
    
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

    // Find and update or create new
    const caseRecord = await CaseRecord.findOneAndUpdate(
      { finalizeId: finalizeRecord._id },
      {
        ...payload,
        finalizeId: finalizeRecord._id,
        caseId: finalizeRecord.caseId,
        lastModifiedBy: req.user?.uid || req.body.lastModifiedBy,
      },
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
      await CaseAssignment.updateMany(
        { finalizeId: finalizeRecord._id },
        { caseTitle: payload.title || payload.caseTitle }
      )
    }

    console.log('Case record saved:', { finalizeId, recordId: caseRecord._id })

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
