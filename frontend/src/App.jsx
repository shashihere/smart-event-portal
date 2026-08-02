import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Ticket, User, Shield, MapPin, Search, LogIn, Clock, Flame } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Shared Components ---
function Navbar() {
  const currentUserId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">SmartEvents</Link>
      <div className="nav-links">
        <Link to="/events"><Calendar size={18} /> Events</Link>
        <Link to="/dashboard"><User size={18} /> Dashboard</Link>
        <Link to="/admin"><Shield size={18} /> Admin</Link>
        {currentUserId ? (
          <button className="btn" onClick={handleLogout} style={{marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>
             Logout
          </button>
        ) : (
          <Link to="/auth" style={{marginLeft: '1rem'}}>
            <button className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>
              <LogIn size={16} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/> Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}

// Countdown Timer Component
function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft('Event Started');
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m left`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown">
      <Clock size={14} /> <span>{timeLeft || 'Calculating...'}</span>
    </div>
  );
}

// --- Pages ---

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      axios.post(`${API_URL}/auth/login`, { email, password })
        .then(res => {
          alert(res.data.message);
          localStorage.setItem('userId', res.data.userId);
          navigate('/events');
        })
        .catch(err => {
          alert(err.response?.data?.error || 'Login failed');
        });
    } else {
      axios.post(`${API_URL}/auth/signup`, { name, email, password })
        .then(res => {
          alert(res.data.message);
          setIsLogin(true);
        })
        .catch(err => {
          alert(err.response?.data?.error || 'Signup failed');
        });
    }
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', textAlign: 'center'}}>
        <h2 style={{marginBottom: '2rem'}}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit} style={{textAlign: 'left'}}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input required type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input required type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <button type="submit" className="btn" style={{width: '100%', marginTop: '1rem', padding: '1rem'}}>
            {isLogin ? 'Login to Dashboard' : 'Sign Up'}
          </button>
        </form>

        <p style={{marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold'}}>
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

  const loadEvents = () => {
    axios.get(`${API_URL}/events`)
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const handleBook = (eventId) => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      alert("Please login first to book tickets!");
      return;
    }

    axios.post(`${API_URL}/bookings`, { userId: currentUserId, eventId, tickets: 1 })
      .then(() => {
        alert('Ticket Booked Successfully! Check your Dashboard for the QR Code.');
        loadEvents(); // refresh availability
      })
      .catch(err => alert(err.response?.data?.error || 'Booking failed.'));
  };

  return (
    <div>
      <div className="search-container">
        <input type="text" placeholder="Search for premium events..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Search size={20} style={{position: 'absolute', left: '1rem', top: '1.25rem', color: '#94a3b8'}} />
      </div>
      
      <h2>Upcoming Events</h2>
      
      <div className="events-grid">
        {filtered.map(e => {
          const available = (e.capacity || 50) - (e.booked || 0);
          const percentBooked = Math.min(100, ((e.booked || 0) / (e.capacity || 50)) * 100);
          const isSellingFast = percentBooked > 80;

          return (
            <div key={e._id} className="card event-card">
              <Countdown targetDate={e.date} />
              
              <h3>{e.title}</h3>
              <div className="date"><Calendar size={16} /> {e.date}</div>
              <div className="location"><MapPin size={16} /> {e.location}</div>
              <p style={{marginTop: '1rem', lineHeight: '1.5', color: '#cbd5e1'}}>{e.description}</p>
              
              {/* Scarcity Bar */}
              <div className="scarcity-container" style={{marginTop: '1.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: isSellingFast ? '#ec4899' : '#94a3b8'}}>
                  <span>{isSellingFast ? <><Flame size={14} style={{display:'inline', marginBottom:'-2px'}}/> Selling Fast!</> : 'Availability'}</span>
                  <span>{available} tickets left</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{width: `${percentBooked}%`, background: isSellingFast ? 'linear-gradient(90deg, #f43f5e, #ec4899)' : 'linear-gradient(90deg, var(--secondary-color), var(--primary-color))'}}></div>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem'}}>
                <span className="price">${e.price}</span>
                <button className="btn" onClick={() => handleBook(e._id)} disabled={available <= 0} style={{opacity: available <= 0 ? 0.5 : 1}}>
                  <Ticket size={16} style={{display:'inline', marginBottom:'-2px', marginRight: '6px'}}/> 
                  {available > 0 ? 'Book Now' : 'Sold Out'}
                </button>
              </div>
            </div>
          );
        })}
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
  const [bookings, setBookings] = useState([]);
  const currentUserId = localStorage.getItem('userId');
  
  useEffect(() => {
    if (currentUserId) {
      axios.get(`${API_URL}/bookings/${currentUserId}`)
        .then(res => setBookings(res.data))
        .catch(err => console.error(err));
    }
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="card" style={{textAlign:'center', padding: '4rem 2rem'}}>
        <h2>Access Denied</h2>
        <p style={{color: '#94a3b8'}}>You must be logged in to view your tickets.</p>
        <Link to="/auth"><button className="btn" style={{marginTop:'1rem'}}>Login Now</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>My Digital Tickets</h2>
      {bookings.length === 0 ? (
        <div className="card">
          <p style={{color: '#94a3b8'}}>No tickets booked yet.</p>
        </div>
      ) : (
        <div className="events-grid">
          {bookings.map((b, i) => (
            <div key={i} className="card ticket-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
              <h3 style={{fontSize: '1.2rem', marginBottom: '1rem'}}>{b.event?.title || 'Unknown Event'}</h3>
              
              {/* QR Code Graphic using API */}
              <div className="qr-container" style={{background: 'white', padding: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${b._id}`} alt="QR Code" />
              </div>
              
              <div style={{width: '100%', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '1rem', fontSize: '0.9rem', color: '#cbd5e1'}}>
                <p><strong>Date:</strong> {b.event?.date}</p>
                <p><strong>Location:</strong> {b.event?.location}</p>
                <p><strong>Qty:</strong> {b.tickets}</p>
                <p style={{marginTop: '0.5rem', fontSize: '0.7rem', color: '#4facfe'}}>ID: {b._id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Admin() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState(50);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/events`, { title, date, description, location, price, capacity })
      .then(() => {
        alert('Event added successfully!');
        setTitle(''); setDate(''); setDescription(''); setLocation(''); setPrice(''); setCapacity(50);
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
              <label>Date (Future date for countdown)</label>
              <input required type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div>
              <label>Price ($)</label>
              <input required type="number" placeholder="0" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <label>Location</label>
              <input required placeholder="e.g., Neo Tokyo / Online" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <div>
              <label>Ticket Capacity</label>
              <input required type="number" placeholder="50" value={capacity} onChange={e=>setCapacity(e.target.value)} />
            </div>
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
