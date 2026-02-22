import ClientsInfo from '../models/clientsinfo.js'
import admin from 'firebase-admin'
import User from '../models/user.js'
import { createNotification } from './notificationController.js'

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTime = (value) => {
  if (!value) return '';
  // Accept HH:mm or HH:mm:ss, trim to HH:mm
  const match = /^\s*(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return '';
  const hour = String(match[1]).padStart(2, '0');
  const minute = match[2];
  return `${hour}:${minute}`;
};

const cleanPhone = (value) => {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('09') && digits.length === 11) return digits;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits;
};

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

// Public appointment submission (no auth required)
export const createPublicAppointment = async (req, res) => {
  try {
    const { fullName, phone, appointmentDate, appointmentTime } = req.body || {};

    if (!fullName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: 'fullName, appointmentDate, and appointmentTime are required',
      });
    }

    const normalizedDate = normalizeDate(appointmentDate);
    const normalizedTime = normalizeTime(appointmentTime);
    const cleanedPhone = cleanPhone(phone);

    if (!normalizedDate) {
      return res.status(400).json({ message: 'Invalid appointmentDate' });
    }

    if (!normalizedTime) {
      return res.status(400).json({ message: 'Invalid appointmentTime' });
    }

    const doc = new ClientsInfo({
      fullName,
      contactNumber: cleanedPhone,
      appointedDate: normalizedDate,
      appointmentTime: normalizedTime,
      status: 'auto-scheduled',
      source: 'public-appointment',
      personal: {
        fullName,
        contactNumber: cleanedPhone,
      },
      caseDetails: {
        appointmentTime: normalizedTime,
        appointedDate: normalizedDate,
      },
      review: {
        source: 'public-appointment',
      },
    });

    const saved = await doc.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createPublicAppointment error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Returns only basic schedule info for public calendar visibility
export const listPublicSchedules = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const docs = await ClientsInfo.find({
      appointedDate: { $gte: today },
      status: { $nin: ['rejected'] }
    })
    .select('appointedDate appointmentTime status')
    .sort({ appointedDate: 1, appointmentTime: 1 })
    .lean();

    return res.json(docs);
  } catch (err) {
    console.error('listPublicSchedules error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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
    const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern', 'director', 'supervising_lawyer'];
    
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

    // Fetch old record BEFORE updating (for notification comparison)
    const oldRecord = await ClientsInfo.findById(id)

    const update = {}
    const setField = (key, transform) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        update[key] = transform ? transform(payload[key]) : payload[key]
      }
    }

    setField('appointedDate', (v) => (v ? new Date(v) : v))
    setField('appointmentTime')
    setField('status')
    setField('fullName')
    setField('caseNumber')

    // Calendar recording fields
    setField('calendarRecorded', (v) => Boolean(v))
    setField('calendarEventId')
    setField('calendarRecordedAt', (v) => (v ? new Date(v) : v))
    setField('calendarRecordedBy')

    // Personal Details
    setField('name')
    setField('age', (v) => (v === '' || v === null || v === undefined ? v : Number(v)))
    setField('birthday')
    setField('sex')
    setField('civilStatus')
    setField('citizenship')
    setField('contactNumber')
    setField('cellphoneNumber')
    setField('telephoneNumber')
    setField('email')
    setField('presentAddress')
    setField('permanentAddress')
    setField('spouseName')
    setField('throughRelator')
    setField('relatorName')
    setField('relationshipToClient')
    setField('relatorContactNumber')

    // Financial Details
    setField('currentSourceOfIncome')
    setField('monthlyIncome', (v) => (v === '' || v === null || v === undefined ? v : Number(v)))
    setField('natureOfWork')
    setField('employerName')
    setField('employerAddress')
    setField('employerTelephone')
    setField('spouseSourceOfIncome')
    setField('spouseMonthlyIncome', (v) => (v === '' || v === null || v === undefined ? v : Number(v)))
    setField('spouseEmployerAddress')
    setField('totalCombinedIncome', (v) => (v === '' || v === null || v === undefined ? v : Number(v)))
    setField('dependents', (v) => (v === '' || v === null || v === undefined ? v : Number(v)))

    // Case Details
    setField('partyRepresented')
    setField('venue')
    setField('presentStage')
    setField('caseNature')
    setField('natureOfCase')
    setField('courtDivision')
    setField('courtAddress')
    setField('courtPhoneNumber')
    setField('presidingOfficer')
    setField('caseDescription')
    setField('adverseParty')
    setField('adversePartyAddress')
    setField('adversePartyCounsel')
    setField('adversePartyCounselAddress')
    setField('adversePartyCounselPhone')
    setField('legalMatter')
    setField('location')
    setField('appointmentType')
    setField('urgencyLevel')

    // Nested payloads (backward compatibility)
    setField('personal')
    setField('financial')
    setField('caseDetails')
    setField('review')

    const updated = await ClientsInfo.findByIdAndUpdate(id, update, { new: true })
    if (!updated) return res.status(404).json({ message: 'ClientsInfo not found' })

    // ── Notify client about appointment changes ──
    if (oldRecord && updated.firebaseUid) {
      // Determine who is making the change
      let requesterUid = null;
      if (req.headers.authorization?.startsWith('Bearer ')) {
        try {
          const decoded = await admin.auth().verifyIdToken(req.headers.authorization.split(' ')[1]);
          requesterUid = decoded.uid;
        } catch (_) { /* ignore */ }
      }

      const dateChanged = update.appointedDate && oldRecord.appointedDate &&
        new Date(update.appointedDate).getTime() !== new Date(oldRecord.appointedDate).getTime();
      const timeChanged = update.appointmentTime !== undefined &&
        update.appointmentTime !== (oldRecord.appointmentTime || '');
      const statusChanged = update.status && update.status !== oldRecord.status;

      const shouldNotify = dateChanged || timeChanged || statusChanged;

      if (shouldNotify) {
        // Build identifying info for the appointment
        const appointmentLabel = updated.appointmentType || updated.caseNature || updated.legalMatter || '';
        const caseNum = updated.caseNumber ? ` (Case #${updated.caseNumber})` : '';
        const clientName = updated.fullName || updated.name || '';
        const identifier = appointmentLabel
          ? `"${appointmentLabel}"${caseNum}`
          : clientName
            ? `for ${clientName}${caseNum}`
            : caseNum || 'Your appointment';

        // Build a human-readable change description
        const changes = [];
        if (dateChanged) {
          const oldDate = new Date(oldRecord.appointedDate).toLocaleDateString();
          const newDate = new Date(update.appointedDate).toLocaleDateString();
          changes.push(`rescheduled from ${oldDate} to ${newDate}`);
        }
        if (timeChanged && update.appointmentTime) {
          changes.push(`time changed to ${update.appointmentTime}`);
        }
        if (statusChanged) {
          changes.push(`status updated to ${update.status}`);
        }

        const changeDesc = changes.join(' and ');
        const notifTitle = statusChanged
          ? `Appointment ${update.status.charAt(0).toUpperCase() + update.status.slice(1)}`
          : 'Appointment Rescheduled';

        // Notify the CLIENT if the change was made by someone else (admin/attorney)
        if (requesterUid !== updated.firebaseUid) {
          createNotification({
            recipientId: updated.firebaseUid,
            title: notifTitle,
            message: `${identifier} has been ${changeDesc}.`,
            type: 'appointment_updated',
            referenceId: id,
          });
        }

        // Also notify the admin/requester if the client made the change (unlikely but safe)
        if (requesterUid === updated.firebaseUid && requesterUid) {
          // Find admins/secretaries to notify — skip for now, client-initiated reschedules are rare
        }
      }
    }

    return res.json(updated)
  } catch (err) {
    console.error('updateClientsInfo error', err)
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}
