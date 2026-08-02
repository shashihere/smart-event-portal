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
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  description: String,
  location: String,
  price: Number,
  capacity: { type: Number, default: 50 },
  booked: { type: Number, default: 0 }
});

const BookingSchema = new mongoose.Schema({
  userId: String,
  eventId: String,
  tickets: Number
});

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use. Please login.' });
    }
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ message: 'User created successfully' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }
    if (user.password !== req.body.password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    res.json({ message: 'Login successful', userId: user._id });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const { userId, eventId, tickets } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.capacity - event.booked < tickets) {
      return res.status(400).json({ error: 'Not enough tickets available!' });
    }
    
    // Update event bookings
    event.booked += tickets;
    await event.save();

    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.json(newBooking);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId });
    
    // Populate event details manually since we don't have Refs set up
    const populatedBookings = await Promise.all(bookings.map(async (b) => {
      const event = await Event.findById(b.eventId);
      return { ...b.toObject(), event };
    }));
    
    res.json(populatedBookings);
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
