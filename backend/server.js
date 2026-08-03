const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_events';

mongoose.connect(mongoURI)
.then(() => console.log('MongoDB connected to', mongoURI))
.catch(err => console.log('MongoDB connection error:', err));

// --- Nodemailer Setup (Ethereal Fake SMTP) ---
let transporter;
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log('Ethereal Email Transporter Ready!');
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket:', socket.id);
});

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});

const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  description: String,
  location: String,
  price: Number,
  capacity: { type: Number, default: 50 },
  booked: { type: Number, default: 0 },
  category: { type: String, default: 'Tech' }
});

const BookingSchema = new mongoose.Schema({
  userId: String,
  eventId: String,
  tickets: Number
});

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// --- Routes ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use. Please login.' });
    }
    const role = req.body.email.endsWith('@admin.smartevents.com') ? 'admin' : 'user';
    const newUser = new User({ ...req.body, role });
    await newUser.save();
    res.json({ message: 'User created successfully', role: newUser.role });
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
    res.json({ message: 'Login successful', userId: user._id, role: user.role });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const { category, maxPrice, search } = req.query;
    let query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    if (maxPrice && maxPrice !== '0') {
      query.price = { $lte: Number(maxPrice) };
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const events = await Event.find(query);
    res.json(events);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { adminId, ...eventData } = req.body;
    
    if (!adminId) {
      return res.status(403).json({ error: 'Access Denied: No Admin ID provided.' });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Admin privileges required.' });
    }

    const newEvent = new Event(eventData);
    await newEvent.save();
    
    // Notify all clients that a new event was created!
    io.emit('events_updated');

    res.json(newEvent);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, eventId, tickets } = req.body;
    
    const user = await User.findById(userId);
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
    
    // Notify clients of capacity change
    io.emit('events_updated');

    // Send Confirmation Email!
    if (transporter && user) {
      let message = {
        from: '"SmartEvents Team" <no-reply@smartevents.com>',
        to: user.email,
        subject: `Your Ticket: ${event.title}`,
        text: `Hello ${user.name},\n\nYour ticket for ${event.title} is confirmed!\n\nDate: ${event.date}\nLocation: ${event.location}\nTickets: ${tickets}\n\nShow your QR code from the Dashboard to enter.`,
        html: `<p>Hello <b>${user.name}</b>,</p><p>Your ticket for <b>${event.title}</b> is confirmed!</p><p>View your QR code on the dashboard!</p>`
      };
      
      transporter.sendMail(message, (err, info) => {
        if (err) {
          console.error('Error sending email:', err.message);
        } else {
          console.log('====================================');
          console.log('Confirmation Email Sent!');
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
          console.log('====================================');
        }
      });
    }

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

// Admin Analytics Route
app.get('/api/analytics', async (req, res) => {
  try {
    const events = await Event.find();
    let totalRevenue = 0;
    let totalTickets = 0;
    
    const chartData = events.map(e => {
      const revenue = (e.booked || 0) * (e.price || 0);
      totalRevenue += revenue;
      totalTickets += (e.booked || 0);
      return {
        name: e.title,
        sales: e.booked || 0,
        capacity: e.capacity || 50,
        revenue: revenue
      };
    });

    res.json({ totalRevenue, totalTickets, chartData });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Use `server.listen` instead of `app.listen` for Socket.IO
server.listen(port, '0.0.0.0', () => {
  console.log(`Server (with WebSockets) is running on port: ${port}`);
});
