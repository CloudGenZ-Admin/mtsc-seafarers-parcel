import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LOGO = 'https://mtsc.ca/wp-content/uploads/2025/09/seafarers-logo.png.webp';

const seafarerLinks = [
  { to: '/dashboard', label: 'My Parcels' },
  { to: '/parcels/new', label: 'New Parcel' },
  { to: '/past-pickups', label: 'History' },
];
const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard' },
  { to: '/staff/scan', label: 'Scan QR' },
  { to: '/staff/reports', label: 'Reports' },
];

export default function Navbar() {
  const { user, logout, isSeafarer, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setOpen(false); };
  const links = isSeafarer ? seafarerLinks : isStaff ? staffLinks : [];
  const isActive = (to) => location.pathname === to;

  if (!user) return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/login" style={styles.brand}>
          <img src={LOGO} alt="MTSC" style={styles.logo} />
          <span style={styles.brandText}>Parcel Pickup</span>
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>
          <Link to={isStaff ? '/staff/dashboard' : '/dashboard'} style={styles.brand}>
            <img src={LOGO} alt="MTSC" style={styles.logo} />
            <span style={styles.brandText}>Parcel Pickup</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop" style={styles.desktopLinks}>
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{ ...styles.link, ...(isActive(l.to) ? styles.linkActive : {}) }}>
                {l.label}
              </Link>
            ))}
            <div style={styles.divider} />
            <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
          </div>

          {/* Mobile hamburger */}
          <button className="nav-hamburger" onClick={() => setOpen(!open)} style={styles.hamburger} aria-label="Menu">
            <span style={{ ...styles.bar, transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ ...styles.bar, opacity: open ? 0 : 1 }} />
            <span style={{ ...styles.bar, transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="nav-mobile-menu" style={styles.mobileMenu}>
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              style={{ ...styles.mobileLink, ...(isActive(l.to) ? styles.mobileLinkActive : {}) }}>
              {l.label}
            </Link>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button onClick={handleLogout} style={styles.mobileLogout}>Log Out</button>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    background: '#0f2744',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  inner: {
    maxWidth: 820,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  brand: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logo: { height: 34, borderRadius: 4 },
  brandText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
  },
  desktopLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  link: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: 6,
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  linkActive: {
    color: '#ffffff',
    background: 'rgba(255,255,255,0.1)',
  },
  divider: {
    width: 1,
    height: 20,
    background: 'rgba(255,255,255,0.15)',
    margin: '0 8px',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hamburger: {
    flexDirection: 'column',
    gap: 4,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
  },
  bar: {
    display: 'block',
    width: 20,
    height: 2,
    background: '#fff',
    borderRadius: 1,
    transition: 'all 0.2s',
  },
  mobileMenu: {
    position: 'fixed',
    top: 60,
    left: 0,
    right: 0,
    background: '#0f2744',
    padding: '8px 16px 16px',
    zIndex: 99,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileLink: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: 500,
    padding: '12px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    display: 'block',
  },
  mobileLinkActive: {
    color: '#ffffff',
    background: 'rgba(255,255,255,0.1)',
  },
  mobileLogout: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: 500,
    padding: '12px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: 8,
  },
};
