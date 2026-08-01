const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_events';

mongoose.connect(mongoURI)
.then(() => console.log('MongoDB connected to', mongoURI))
.catch(err => console.log('MongoDB connection error:', err));

// Schemas
const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  description: String,
  location: String,
  price: Number
});

const BookingSchema = new mongoose.Schema({
  userId: String,
  eventId: String,
  tickets: Number
});

const Event = mongoose.model('Event', EventSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.json(newEvent);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.json(newBooking);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port: ${port}`);
});
