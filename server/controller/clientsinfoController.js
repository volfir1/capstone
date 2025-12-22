import ClientsInfo from '../models/clientsinfo.js'

export const createClientsInfo = async (req, res) => {
  try {
    const payload = req.body || {}

    const appointedDateRaw =
      payload.appointedDate ||
      payload.caseDetails?.appointedDate ||
      payload.appointmentDate ||
      payload.dateSubmitted ||
      payload.submittedAt ||
      new Date().toISOString()

    const doc = new ClientsInfo({
      fullName: payload.personal?.fullName || payload.fullName || '',
      caseNumber: payload.caseDetails?.caseNumber || payload.caseNumber || '',
      appointedDate: appointedDateRaw ? new Date(appointedDateRaw) : undefined,
      personal: payload.personal || payload.personalInfo || {},
      financial: payload.financial || {},
      caseDetails: payload.caseDetails || {},
      review: payload.review || {},
    })

    const saved = await doc.save()
    return res.status(201).json(saved)
  } catch (err) {
    console.error('createClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const listClientsInfo = async (req, res) => {
  try {
    const docs = await ClientsInfo.find().sort({ createdAt: -1 }).limit(200)
    return res.json(docs)
  } catch (err) {
    console.error('listClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const updateClientsInfo = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body || {}

    const update = {}
    if (payload.appointedDate) update.appointedDate = new Date(payload.appointedDate)
    if (payload.fullName) update.fullName = payload.fullName
    if (payload.caseNumber) update.caseNumber = payload.caseNumber

    const updated = await ClientsInfo.findByIdAndUpdate(id, update, { new: true })
    if (!updated) return res.status(404).json({ message: 'ClientsInfo not found' })

    return res.json(updated)
  } catch (err) {
    console.error('updateClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}
