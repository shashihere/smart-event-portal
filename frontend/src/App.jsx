import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Ticket, User, Shield, MapPin, Search, LogIn } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">SmartEvents</Link>
      <div className="nav-links">
        <Link to="/events"><Calendar size={18} /> Events</Link>
        <Link to="/dashboard"><User size={18} /> Dashboard</Link>
        <Link to="/admin"><Shield size={18} /> Admin</Link>
        <Link to="/auth" style={{marginLeft: '1rem'}}>
          <button className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>
            <LogIn size={16} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/> Login
          </button>
        </Link>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="hero">
      <h1>Experience the <br/>Extraordinary</h1>
      <p>Discover and book tickets to the most exclusive tech summits, cyber-concerts, and VIP events around the globe. Your next adventure starts here.</p>
      <Link to="/events"><button className="btn">Browse Events</button></Link>
    </div>
  );
}

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate authentication
    alert(isLogin ? 'Successfully logged in!' : 'Account created successfully!');
    navigate('/dashboard');
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', textAlign: 'center'}}>
        <h2 style={{marginBottom: '2rem'}}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit} style={{textAlign: 'left'}}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input required type="text" placeholder="John Doe" />
            </div>
          )}
          
          <div className="form-group">
            <label>Email Address</label>
            <input required type="email" placeholder="you@example.com" />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input required type="password" placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn" style={{width: '100%', marginTop: '1rem', padding: '1rem'}}>
            {isLogin ? 'Login to Dashboard' : 'Sign Up'}
          </button>
        </form>

        <p style={{marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold'}}
          >
            {isLogin ? 'Sign up here' : 'Login here'}
          </span>
        </p>
      </div>
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
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search for premium events..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search size={20} style={{position: 'absolute', left: '1rem', top: '1.25rem', color: '#94a3b8'}} />
      </div>
      
      <h2>Upcoming Events</h2>
      
      <div className="events-grid">
        {filtered.map(e => (
          <div key={e._id} className="card event-card">
            <h3>{e.title}</h3>
            <div className="date">
              <Calendar size={16} /> {e.date}
            </div>
            <div className="location">
              <MapPin size={16} /> {e.location}
            </div>
            <p style={{marginTop: '1rem', lineHeight: '1.5', color: '#cbd5e1'}}>{e.description}</p>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem'}}>
              <span className="price">${e.price}</span>
              <button className="btn" onClick={() => handleBook(e._id)}>
                <Ticket size={16} style={{display:'inline', marginBottom:'-2px', marginRight: '6px'}}/> 
                Book Now
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center'}}>
            <h3 style={{marginBottom: 0}}>No events found</h3>
            <p style={{color: '#94a3b8', marginTop: '0.5rem'}}>Check back later or adjust your search.</p>
          </div>
        )}
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
        <p style={{color: '#94a3b8'}}>No bookings found yet.</p>
      </div>
    </div>
  );
}

function Admin() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/events`, { title, date, description, location, price })
      .then(() => {
        alert('Event added successfully!');
        setTitle(''); setDate(''); setDescription(''); setLocation(''); setPrice('');
      })
      .catch(err => alert('Failed to add event.'));
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
        <h3 style={{marginBottom: '1.5rem'}}>Create New Event</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title</label>
            <input required placeholder="e.g., Cyber Security Summit" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <label>Date</label>
              <input required type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div>
              <label>Price ($)</label>
              <input required type="number" placeholder="0" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input required placeholder="e.g., Neo Tokyo / Online" value={location} onChange={e=>setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea required placeholder="Detailed description of the event..." value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
          </div>
          <button type="submit" className="btn" style={{width: '100%', marginTop: '1rem'}}>+ Publish Event</button>
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
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
