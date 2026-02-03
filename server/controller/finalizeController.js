import Finalize from '../models/finalize.js'

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

    const updated = await Finalize.findByIdAndUpdate(id, toUpdate, { new: true })
    if (!updated) {
      return res.status(404).json({ error: 'Finalized record not found' })
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
