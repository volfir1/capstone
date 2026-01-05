import Finalize from '../models/finalize.js'

export const createFinalize = async (req, res) => {
  try {
    const payload = req.body
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null
    const decision = payload?.content?.actionInfo?.decision || payload.decision || null

    const toCreate = { ...payload }
    if (caseTitle) toCreate.caseTitle = caseTitle
    if (clientName) toCreate.clientName = clientName
    if (decision) toCreate.decision = decision

    const rec = await Finalize.create(toCreate)
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
