import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Calendar, Ticket, User, Shield, MapPin, Search, LogIn, Clock, Flame, Download, CreditCard } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Tilt from 'react-parallax-tilt';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Connect WebSocket to root backend URL
const socket = io(API_URL.replace('/api', ''), { transports: ['websocket', 'polling'] });

// --- Shared Components ---
function Navbar() {
  const currentUserId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="navbar" style={{position: 'relative', zIndex: 10}}>
      <Link to="/" className="brand">SmartEvents</Link>
      <div className="nav-links">
        <Link to="/events"><Calendar size={18} /> Events</Link>
        <Link to="/dashboard"><User size={18} /> Dashboard</Link>
        {userRole === 'admin' && (
          <Link to="/admin"><Shield size={18} /> Admin</Link>
        )}
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
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
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
    <div className="hero" style={{position: 'relative', zIndex: 10}}>
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
          toast.success(res.data.message);
          localStorage.setItem('userId', res.data.userId);
          localStorage.setItem('userRole', res.data.role);
          navigate(res.data.role === 'admin' ? '/admin' : '/events');
        })
        .catch(err => toast.error(err.response?.data?.error || 'Login failed'));
    } else {
      axios.post(`${API_URL}/auth/signup`, { name, email, password })
        .then(res => {
          toast.success(res.data.message);
          setIsLogin(true);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Signup failed'));
    }
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', position: 'relative', zIndex: 10}}>
      <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
        <div className="card" style={{width: '100%', minWidth: '400px', textAlign: 'center'}}>
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
      </Tilt>
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [cardDetails, setCardDetails] = useState('');

  const loadEvents = useCallback(() => {
    let query = `?search=${search}`;
    if (category !== 'All') query += `&category=${category}`;
    if (maxPrice > 0) query += `&maxPrice=${maxPrice}`;

    axios.get(`${API_URL}/events${query}`)
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [search, category, maxPrice]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setLoading(true);
      loadEvents();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, category, maxPrice, loadEvents]);

  // Listen for Live WebSocket Updates
  useEffect(() => {
    socket.on('events_updated', () => {
      toast('Live Update: Event capacity changed!', { icon: '⚡' });
      loadEvents();
    });
    return () => socket.off('events_updated');
  }, [loadEvents]);

  const initiateBooking = (event) => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      toast.error("Please login first to book tickets!");
      return;
    }
    setPaymentEvent(event);
  };

  const finalizePayment = (e) => {
    e.preventDefault();
    if (cardDetails.length < 16) {
      toast.error("Invalid simulated credit card.");
      return;
    }
    
    toast.loading("Processing Payment...", { id: "payment" });
    
    // Simulate network delay for payment gateway
    setTimeout(() => {
      const currentUserId = localStorage.getItem('userId');
      axios.post(`${API_URL}/bookings`, { userId: currentUserId, eventId: paymentEvent._id, tickets: 1 })
        .then(() => {
          toast.success('Payment Successful! Ticket generated.', { id: "payment" });
          setPaymentEvent(null);
          setCardDetails('');
        })
        .catch(err => toast.error(err.response?.data?.error || 'Booking failed.', { id: "payment" }));
    }, 1500);
  };

  return (
    <div style={{position: 'relative', zIndex: 10}}>
      {/* Advanced Filters */}
      <div className="card" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem'}}>
        <div style={{flexGrow: 1, minWidth: '200px'}}>
          <label>Search Events</label>
          <div className="search-container" style={{margin: 0, width: '100%'}}>
            <input type="text" placeholder="Search title or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Search size={18} style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
          </div>
        </div>
        <div style={{minWidth: '150px'}}>
          <label>Category</label>
          <select style={{width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(15,23,42,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Tech">Tech</option>
            <option value="Music">Music</option>
            <option value="Gaming">Gaming</option>
          </select>
        </div>
        <div style={{minWidth: '150px'}}>
          <label>Max Price: ${maxPrice}</label>
          <input type="range" min="0" max="1000" step="50" style={{width: '100%', marginTop: '0.5rem'}} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>
      
      {/* Payment Modal */}
      {paymentEvent && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.05}>
            <div className="card" style={{width: '400px'}}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CreditCard /> Secure Checkout</h2>
              <p style={{color: '#94a3b8', marginBottom: '1.5rem'}}>You are booking 1 ticket for <b>{paymentEvent.title}</b>.</p>
              
              <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between'}}>
                <span>Total Amount:</span>
                <span className="price">${paymentEvent.price}</span>
              </div>

              <form onSubmit={finalizePayment}>
                <div className="form-group">
                  <label>Credit Card Number (Mock Stripe)</label>
                  <input required type="text" placeholder="4242 4242 4242 4242" value={cardDetails} onChange={e=>setCardDetails(e.target.value)} maxLength={16} />
                </div>
                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                  <button type="button" className="btn" style={{background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8'}} onClick={() => setPaymentEvent(null)}>Cancel</button>
                  <button type="submit" className="btn" style={{flexGrow: 1}}>Pay Now</button>
                </div>
              </form>
            </div>
          </Tilt>
        </div>
      )}
      
      <div className="events-grid">
        {loading ? (
          <><div className="skeleton-card"></div><div className="skeleton-card"></div><div className="skeleton-card"></div></>
        ) : (
          <>
            {events.map(e => {
              const available = (e.capacity || 50) - (e.booked || 0);
              const percentBooked = Math.min(100, ((e.booked || 0) / (e.capacity || 50)) * 100);
              const isSellingFast = percentBooked > 80;

              return (
                <Tilt key={e._id} tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.02} transitionSpeed={1000} className="parallax-effect">
                  <div className="card event-card" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <Countdown targetDate={e.date} />
                    <h3>{e.title}</h3>
                    <div style={{display: 'inline-block', background: 'rgba(79,172,254,0.1)', padding: '0.2rem 0.6rem', borderRadius: '15px', color: '#4facfe', fontSize: '0.75rem', marginBottom: '1rem', width: 'fit-content'}}>
                      {e.category || 'Tech'}
                    </div>
                    <div className="date"><Calendar size={16} /> {e.date}</div>
                    <div className="location"><MapPin size={16} /> {e.location}</div>
                    <p style={{marginTop: '0.5rem', lineHeight: '1.5', color: '#cbd5e1', flexGrow: 1}}>{e.description}</p>
                    
                    <div className="scarcity-container" style={{marginTop: '1.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: isSellingFast ? '#ec4899' : '#94a3b8'}}>
                        <span>{isSellingFast ? <><Flame size={14} style={{display:'inline', marginBottom:'-2px'}}/> Selling Fast!</> : 'Availability'}</span>
                        <span>{available} left</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{width: `${percentBooked}%`, background: isSellingFast ? 'linear-gradient(90deg, #f43f5e, #ec4899)' : 'linear-gradient(90deg, var(--secondary-color), var(--primary-color))'}}></div>
                      </div>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem'}}>
                      <span className="price">${e.price}</span>
                      <button className="btn" onClick={() => initiateBooking(e)} disabled={available <= 0} style={{opacity: available <= 0 ? 0.5 : 1}}>
                        <Ticket size={16} style={{display:'inline', marginBottom:'-2px', marginRight: '6px'}}/> 
                        {available > 0 ? 'Checkout' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                </Tilt>
              );
            })}
            {events.length === 0 && (
              <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center'}}>
                <h3 style={{marginBottom: 0}}>No events match filters</h3>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem('userId');
  
  useEffect(() => {
    if (currentUserId) {
      setTimeout(() => {
        axios.get(`${API_URL}/bookings/${currentUserId}`)
          .then(res => {
            setBookings(res.data);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      }, 600);
    } else {
      setLoading(false);
    }
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="card" style={{textAlign:'center', padding: '4rem 2rem', position: 'relative', zIndex: 10}}>
        <h2>Access Denied</h2>
        <p style={{color: '#94a3b8'}}>You must be logged in to view your tickets.</p>
        <Link to="/auth"><button className="btn" style={{marginTop:'1rem'}}>Login Now</button></Link>
      </div>
    );
  }

  return (
    <div style={{position: 'relative', zIndex: 10}}>
      <h2>My Digital Tickets</h2>
      {loading ? (
         <div className="events-grid"><div className="skeleton-card"></div><div className="skeleton-card"></div></div>
      ) : bookings.length === 0 ? (
        <div className="card"><p style={{color: '#94a3b8'}}>No tickets booked yet.</p></div>
      ) : (
        <div className="events-grid">
          {bookings.map((b, i) => (
            <Tilt key={i} tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.05} transitionSpeed={2000}>
              <div className="card ticket-card" style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <h3 style={{fontSize: '1.2rem', marginBottom: '1rem'}}>{b.event?.title || 'Unknown Event'}</h3>
                <div className="qr-container" style={{background: 'white', padding: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${b._id}`} alt="QR Code" />
                </div>
                <div style={{width: '100%', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '1rem', fontSize: '0.9rem', color: '#cbd5e1', flexGrow: 1}}>
                  <p><strong>Date:</strong> {b.event?.date}</p>
                  <p><strong>Location:</strong> {b.event?.location}</p>
                  <p><strong>Qty:</strong> {b.tickets}</p>
                  <p style={{marginTop: '0.5rem', fontSize: '0.7rem', color: '#4facfe'}}>ID: {b._id}</p>
                </div>
              </div>
            </Tilt>
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
  const [category, setCategory] = useState('Tech');
  
  const [analytics, setAnalytics] = useState(null);
  
  const currentUserId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  const loadAnalytics = () => {
    axios.get(`${API_URL}/analytics`)
      .then(res => setAnalytics(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    if (userRole === 'admin') {
      loadAnalytics();
      socket.on('events_updated', loadAnalytics);
    }
    return () => socket.off('events_updated');
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02}>
        <div className="card" style={{textAlign:'center', padding: '4rem 2rem', border: '1px solid #f43f5e', position: 'relative', zIndex: 10}}>
          <Shield size={48} color="#f43f5e" style={{marginBottom: '1rem'}} />
          <h2>Access Denied</h2>
          <p style={{color: '#94a3b8'}}>Admin privileges required. Your IP has been logged.</p>
          <Link to="/auth"><button className="btn" style={{marginTop:'1rem'}}>Login as Admin</button></Link>
        </div>
      </Tilt>
    );
  }

  const exportCSV = () => {
    if (!analytics || !analytics.chartData) return;
    const headers = "Event,Tickets Sold,Capacity,Revenue\n";
    const rows = analytics.chartData.map(d => `"${d.name}",${d.sales},${d.capacity},${d.revenue}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success("CSV Downloaded!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/events`, { adminId: currentUserId, title, date, description, location, price, capacity, category })
      .then(() => {
        toast.success('Event published to live database!');
        setTitle(''); setDate(''); setDescription(''); setLocation(''); setPrice(''); setCapacity(50); setCategory('Tech');
      })
      .catch(err => toast.error(err.response?.data?.error || 'Failed to add event.'));
  };

  return (
    <div style={{position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
      <div>
        <h2 style={{display: 'flex', justifyContent: 'space-between'}}>
          Analytics <button className="btn" onClick={exportCSV} style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}><Download size={14} style={{display:'inline', marginBottom:'-2px'}}/> Export CSV</button>
        </h2>
        <div className="card" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', textAlign: 'center'}}>
            <div>
              <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>Total Revenue</p>
              <h3 className="price" style={{fontSize: '2rem'}}>${analytics?.totalRevenue || 0}</h3>
            </div>
            <div>
              <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>Tickets Sold</p>
              <h3 style={{fontSize: '2rem', color: '#4facfe'}}>{analytics?.totalTickets || 0}</h3>
            </div>
          </div>
          
          <h4 style={{marginBottom: '1rem', color: '#94a3b8'}}>Sales by Event</h4>
          <div style={{width: '100%', height: 300}}>
            {analytics && analytics.chartData && analytics.chartData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={analytics.chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                  <Bar dataKey="sales" fill="#4facfe" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#94a3b8'}}>No sales data yet.</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2>Create Event</h2>
        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={3000}>
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Title</label>
                <input required placeholder="e.g., Cyber Security Summit" value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label>Date (Future date)</label>
                  <input required type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
                </div>
                <div>
                  <label>Price ($)</label>
                  <input required type="number" placeholder="0" value={price} onChange={e=>setPrice(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div style={{gridColumn: '1 / 3'}}>
                  <label>Location</label>
                  <input required placeholder="e.g., Neo Tokyo" value={location} onChange={e=>setLocation(e.target.value)} />
                </div>
                <div>
                  <label>Category</label>
                  <select style={{width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(15,23,42,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'}} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Tech">Tech</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Ticket Capacity</label>
                <input required type="number" placeholder="50" value={capacity} onChange={e=>setCapacity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea required placeholder="Detailed description..." value={description} onChange={e=>setDescription(e.target.value)} rows={3} />
              </div>
              <button type="submit" className="btn" style={{width: '100%', marginTop: '1rem'}}>+ Publish Event</button>
            </form>
          </div>
        </Tilt>
      </div>
    </div>
  );
}

function App() {
  const particlesInit = useCallback(async engine => {
    await loadFull(engine);
  }, []);

  return (
    <Router>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            color: { value: "#4facfe" },
            links: { color: "#4facfe", distance: 150, enable: true, opacity: 0.2, width: 1 },
            move: { enable: true, speed: 0.5, direction: "none", random: false, straight: false, outModes: { default: "out" } },
            number: { density: { enable: true, area: 800 }, value: 40 },
            opacity: { value: 0.3 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
      />
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
