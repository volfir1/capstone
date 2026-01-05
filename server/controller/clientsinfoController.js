import ClientsInfo from '../models/clientsinfo.js'
import User from '../models/user.js'
import admin from 'firebase-admin'

export const createClientsInfo = async (req, res) => {
  try {
    // Authenticate user
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' })
    }

    const idToken = authHeader.split(' ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const payload = req.body || {}

    const appointedDateRaw =
      payload.appointedDate ||
      payload.caseDetails?.appointedDate ||
      payload.appointmentDate ||
      payload.dateSubmitted ||
      payload.submittedAt ||
      new Date().toISOString()

    const doc = new ClientsInfo({
      userId: user._id,
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
    // Authenticate user
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' })
    }

    const idToken = authHeader.split(' ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user is admin/secretary/attorney - they can see all records
    const allowedRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern']
    let docs
    
    if (allowedRoles.includes(user.role)) {
      // Admin/staff can see all appointments
      docs = await ClientsInfo.find().sort({ createdAt: -1 }).limit(200)
    } else {
      // Regular users can only see their own appointments
      docs = await ClientsInfo.find({ userId: user._id }).sort({ createdAt: -1 }).limit(200)
    }
    
    return res.json(docs)
  } catch (err) {
    console.error('listClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const updateClientsInfo = async (req, res) => {
  try {
    // Authenticate user
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' })
    }

    const idToken = authHeader.split(' ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { id } = req.params
    const payload = req.body || {}

    // Find the record first
    const record = await ClientsInfo.findById(id)
    if (!record) return res.status(404).json({ message: 'ClientsInfo not found' })

    // Check authorization - only owner or admin/staff can update
    const allowedRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern']
    const isOwner = record.userId.toString() === user._id.toString()
    const isAdmin = allowedRoles.includes(user.role)
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own appointments' })
    }

    const update = {}
    if (payload.appointedDate) update.appointedDate = new Date(payload.appointedDate)
    if (payload.fullName) update.fullName = payload.fullName
    if (payload.caseNumber) update.caseNumber = payload.caseNumber

    const updated = await ClientsInfo.findByIdAndUpdate(id, update, { new: true })
    return res.json(updated)
  } catch (err) {
    console.error('updateClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}
