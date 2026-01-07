import Finalize from '../models/finalize.js'

export const createFinalize = async (req, res) => {
  try {
    const payload = req.body
    const caseTitle = payload?.content?.caseInfo?.title || payload.caseTitle || null
    const clientName = payload?.content?.interviewInfo?.clientName || payload.clientName || null

    const toCreate = { ...payload }
    if (caseTitle) toCreate.caseTitle = caseTitle
    if (clientName) toCreate.clientName = clientName

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
