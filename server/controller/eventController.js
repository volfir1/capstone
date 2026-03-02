import Event from '../models/events.js';
import User from '../models/user.js';
import Attorney from '../models/attorney.js';
import { createNotification } from './notificationController.js';

import { safeErrorMessage } from '../utils/errorResponse.js';
// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, description, eventDate, eventType, location, clientName, assignedTo, status, priority } = req.body;
    const createdBy = req.user?.uid || req.user?.email || 'system';

    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const newEvent = new Event({
      title,
      description,
      eventDate,
      eventType,
      location,
      clientName,
      assignedTo,
      status,
      priority,
      createdBy,
    });

    const savedEvent = await newEvent.save();

    // ── Notify assigned person about new event ──
    if (assignedTo) {
      const q = assignedTo.trim();
      let person = await Attorney.findOne({ email: q }).select('firebaseUid').lean();
      if (!person) person = await User.findOne({ email: q }).select('firebaseUid').lean();
      if (!person) person = await Attorney.findOne({ $expr: { $eq: [{ $toLower: { $concat: ['$firstName', ' ', '$lastName'] } }, q.toLowerCase()] } }).select('firebaseUid').lean();
      if (!person) person = await User.findOne({ $expr: { $eq: [{ $toLower: { $concat: ['$firstName', ' ', '$lastName'] } }, q.toLowerCase()] } }).select('firebaseUid').lean();
      if (person?.firebaseUid) {
        createNotification({
          recipientId: person.firebaseUid,
          title: 'New Appointment Scheduled',
          message: `"${title}" on ${new Date(eventDate).toLocaleDateString()}.${location ? ` Location: ${location}` : ''}`,
          type: 'appointment_created',
          referenceId: savedEvent._id.toString(),
        });
      }
    }

    // ── Notify client about their appointment ──
    if (clientName) {
      const q = clientName.trim();
      let client = await User.findOne({ $expr: { $eq: [{ $toLower: { $concat: ['$firstName', ' ', '$lastName'] } }, q.toLowerCase()] } }).select('firebaseUid').lean();
      if (client?.firebaseUid) {
        createNotification({
          recipientId: client.firebaseUid,
          title: 'Appointment Scheduled',
          message: `Your ${eventType || 'appointment'} "${title}" has been scheduled for ${new Date(eventDate).toLocaleDateString()}.`,
          type: 'appointment_created',
          referenceId: savedEvent._id.toString(),
        });
      }
    }

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Get a single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldEvent = await Event.findById(id);
    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // ── Determine if anything meaningful changed ──
    const statusChanged = oldEvent && updateData.status && updateData.status !== oldEvent.status;
    const dateChanged = oldEvent && updateData.eventDate && new Date(updateData.eventDate).getTime() !== new Date(oldEvent.eventDate).getTime();
    const shouldNotify = statusChanged || dateChanged;

    if (shouldNotify) {
      // Build a human-readable change description
      let changeDesc = '';
      if (statusChanged) {
        changeDesc = `has been ${updateData.status}`;
      }
      if (dateChanged) {
        const oldDate = new Date(oldEvent.eventDate).toLocaleDateString();
        const newDate = new Date(updateData.eventDate).toLocaleDateString();
        changeDesc = changeDesc
          ? `${changeDesc} and rescheduled from ${oldDate} to ${newDate}`
          : `has been rescheduled from ${oldDate} to ${newDate}`;
      }

      // Build identifying info
      const eventLabel = updatedEvent.eventType ? updatedEvent.eventType.charAt(0).toUpperCase() + updatedEvent.eventType.slice(1) : 'Appointment';
      const clientInfo = updatedEvent.clientName ? ` for ${updatedEvent.clientName}` : '';
      const locationInfo = updatedEvent.location ? ` at ${updatedEvent.location}` : '';

      const notifTitle = statusChanged
        ? `${eventLabel} ${updateData.status.charAt(0).toUpperCase() + updateData.status.slice(1)}`
        : `${eventLabel} Rescheduled`;

      // ── Collect recipients ──
      const notifyTargets = [];

      const findPerson = async (nameOrEmail) => {
        if (!nameOrEmail) return null;
        const q = nameOrEmail.trim();
        // Try exact email first, then first+last name match
        let person = await Attorney.findOne({ email: q }).select('firebaseUid').lean();
        if (!person) person = await User.findOne({ email: q }).select('firebaseUid').lean();
        if (!person) person = await Attorney.findOne({ $expr: { $eq: [{ $toLower: { $concat: ['$firstName', ' ', '$lastName'] } }, q.toLowerCase()] } }).select('firebaseUid').lean();
        if (!person) person = await User.findOne({ $expr: { $eq: [{ $toLower: { $concat: ['$firstName', ' ', '$lastName'] } }, q.toLowerCase()] } }).select('firebaseUid').lean();
        return person?.firebaseUid || null;
      };

      const assigneeUid = await findPerson(updatedEvent.assignedTo);
      if (assigneeUid) notifyTargets.push(assigneeUid);

      const clientUid = await findPerson(updatedEvent.clientName);
      if (clientUid && !notifyTargets.includes(clientUid)) notifyTargets.push(clientUid);

      for (const uid of notifyTargets) {
        createNotification({
          recipientId: uid,
          title: notifTitle,
          message: `"${updatedEvent.title}"${clientInfo}${locationInfo} ${changeDesc}.`,
          type: 'appointment_updated',
          referenceId: id,
        });
      }
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully', event: deletedEvent });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get events by date range
export const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const events = await Event.find({
      eventDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ eventDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};