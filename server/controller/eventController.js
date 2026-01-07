import Event from '../models/events.js';

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
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
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
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
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
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
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
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
};