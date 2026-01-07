import ClientsInfo from '../models/clientsinfo.js'
import admin from 'firebase-admin'
import User from '../models/user.js'

export const createClientsInfo = async (req, res) => {
  try {
    const payload = req.body || {}
    
    // Get authenticated user info
    let userId = null;
    let firebaseUid = null;
    
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const idToken = req.headers.authorization.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        const user = await User.findOne({ firebaseUid });
        if (user) userId = user._id;
      } catch (authErr) {
        console.log('Auth token verification failed:', authErr.message);
      }
    }

    const appointedDateRaw =
      payload.appointedDate ||
      payload.caseDetails?.appointedDate ||
      payload.appointmentDate ||
      payload.dateSubmitted ||
      payload.submittedAt ||
      new Date().toISOString()

    const appointmentTimeValue = 
      payload.appointmentTime || 
      payload.caseDetails?.appointmentTime || 
      ''

    const doc = new ClientsInfo({
      userId,
      firebaseUid,
      fullName: payload.personal?.fullName || payload.fullName || '',
      caseNumber: payload.caseDetails?.caseNumber || payload.caseNumber || '',
      appointedDate: appointedDateRaw ? new Date(appointedDateRaw) : undefined,
      appointmentTime: appointmentTimeValue,
      status: payload.status || 'auto-scheduled',
      
      // Personal Details fields
      name: payload.name,
      age: payload.age,
      birthday: payload.birthday,
      sex: payload.sex,
      civilStatus: payload.civilStatus,
      citizenship: payload.citizenship,
      contactNumber: payload.contactNumber,
      email: payload.email,
      presentAddress: payload.presentAddress,
      permanentAddress: payload.permanentAddress,
      spouseName: payload.spouseName,
      relatorName: payload.relatorName,
      relatorContactNumber: payload.relatorContactNumber,
      
      // Financial Details fields
      currentSourceOfIncome: payload.currentSourceOfIncome,
      monthlyIncome: payload.monthlyIncome,
      natureOfWork: payload.natureOfWork,
      employerName: payload.employerName,
      employerAddress: payload.employerAddress,
      dependents: payload.dependents,
      
      // Case Details fields
      partyRepresented: payload.partyRepresented,
      venue: payload.venue,
      presentStage: payload.presentStage,
      caseNature: payload.caseNature,
      natureOfCase: payload.natureOfCase,
      courtDivision: payload.courtDivision,
      courtAddress: payload.courtAddress,
      presidingOfficer: payload.presidingOfficer,
      caseDescription: payload.caseDescription,
      adverseParty: payload.adverseParty,
      legalMatter: payload.legalMatter,
      location: payload.location,
      appointmentType: payload.appointmentType,
      urgencyLevel: payload.urgencyLevel,
      
      // Nested objects (kept for backward compatibility)
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
    // Get authenticated user info
    let currentUser = null;
    let firebaseUid = null;
    
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const idToken = req.headers.authorization.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        currentUser = await User.findOne({ firebaseUid });
      } catch (authErr) {
        console.log('Auth token verification failed:', authErr.message);
      }
    }
    
    // Build query based on user role
    let query = {};
    
    // Admin roles (secretary, attorney, intern, etc.) can see all appointments
    const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern'];
    
    if (currentUser && !adminRoles.includes(currentUser.role)) {
      // Regular clients can only see their own appointments
      query = { 
        $or: [
          { userId: currentUser._id },
          { firebaseUid: firebaseUid }
        ]
      };
    }
    // If admin role or no user found, return all (empty query)
    
    const docs = await ClientsInfo.find(query).sort({ createdAt: -1 }).limit(200);
    return res.json(docs);
  } catch (err) {
    console.error('listClientsInfo error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export const getClientsInfoById = async (req, res) => {
  try {
    const { id } = req.params
    const item = await ClientsInfo.findById(id)
    
    if (!item) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    return res.json(item)
  } catch (err) {
    console.error('getClientsInfoById error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

export const updateClientsInfo = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body || {}

    const update = {}
    if (payload.appointedDate) update.appointedDate = new Date(payload.appointedDate)
    if (payload.appointmentTime !== undefined) update.appointmentTime = payload.appointmentTime
    if (payload.status) update.status = payload.status
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
