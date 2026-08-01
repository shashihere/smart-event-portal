import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Ticket, User, Shield } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">SmartEvents</Link>
      <div className="nav-links">
        <Link to="/events"><Calendar size={18} style={{display:'inline', marginBottom:'-4px'}}/> Events</Link>
        <Link to="/dashboard"><User size={18} style={{display:'inline', marginBottom:'-4px'}}/> Dashboard</Link>
        <Link to="/admin"><Shield size={18} style={{display:'inline', marginBottom:'-4px'}}/> Admin</Link>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="hero">
      <h1>Experience the Extraordinary</h1>
      <p>Discover and book tickets to the most exclusive events around the globe. Your next adventure starts here.</p>
      <Link to="/events"><button className="btn">Browse Events</button></Link>
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/events`)
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const handleBook = (eventId) => {
    axios.post(`${API_URL}/bookings`, { userId: 'user123', eventId, tickets: 1 })
      .then(() => alert('Ticket Booked Successfully!'))
      .catch(err => alert('Booking failed.'));
  };

  return (
    <div>
      <h2>Upcoming Events</h2>
      <div className="form-group">
        <input 
          type="text" 
          placeholder="Search events... (e.g. Concert)" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="events-grid">
        {filtered.map(e => (
          <div key={e._id} className="card">
            <h3>{e.title}</h3>
            <p style={{color: '#94a3b8'}}>{e.date} • {e.location}</p>
            <p>{e.description}</p>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem'}}>
              <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>${e.price}</span>
              <button className="btn" onClick={() => handleBook(e._id)}>Book Now</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p>No events found.</p>}
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>My Dashboard</h2>
      <div className="card">
        <h3>Booking History</h3>
        <p>No bookings found yet.</p>
      </div>
    </div>
  );
}

function Admin() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/events`, { title, date, description, location, price })
      .then(() => {
        alert('Event added!');
        setTitle(''); setDate(''); setDescription(''); setLocation(''); setPrice(0);
      })
      .catch(err => alert('Failed to add event.'));
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
        <h3>Create New Event</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title</label>
            <input required value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input required type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input required value={location} onChange={e=>setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input required type="number" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea required value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
          </div>
          <button type="submit" className="btn" style={{width: '100%'}}>Add Event</button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
