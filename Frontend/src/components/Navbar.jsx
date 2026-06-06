import { useNavigate, NavLink } from 'react-router-dom';

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const parsedUser = getStoredUser();
  const user =
    localStorage.getItem('username') ||
    localStorage.getItem('email') ||
    parsedUser?.name ||
    parsedUser?.email ||
    'User';

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    navigate('/login');
  };

  return (
    <nav className="mk-navbar">
      {/* Brand / Logo */}
      <div className="navbar-brand">
        <div className="navbar-logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Lantern top hook */}
            <path d="M11 1 L11 3.5" stroke="#c9974a" strokeWidth="1.4" strokeLinecap="round"/>
            {/* Lantern cap */}
            <rect x="7" y="3.5" width="8" height="2.5" rx="1" fill="#c9974a" opacity="0.85"/>
            {/* Lantern body */}
            <rect x="6" y="6" width="10" height="12" rx="2" fill="none" stroke="#c9974a" strokeWidth="1.3" opacity="0.9"/>
            {/* Lantern vertical bars */}
            <line x1="9" y1="6" x2="9" y2="18" stroke="#c9974a" strokeWidth="0.7" opacity="0.5"/>
            <line x1="13" y1="6" x2="13" y2="18" stroke="#c9974a" strokeWidth="0.7" opacity="0.5"/>
            {/* Flame glow */}
            <ellipse cx="11" cy="13" rx="2.2" ry="3" fill="#e8c87a" opacity="0.18"/>
            {/* Flame */}
            <path d="M11 16 C9.5 14.5 9.5 12 11 10.5 C12.5 12 12.5 14.5 11 16Z" fill="#e8b84b" opacity="0.9"/>
            {/* Lantern bottom */}
            <path d="M7 18 L9 21 L13 21 L15 18" stroke="#c9974a" strokeWidth="1" fill="none" opacity="0.7"/>
          </svg>
        </div>
        <span className="navbar-title">Maktab e Kamil</span>
      </div>

      {/* Nav links */}
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>Dashboard</NavLink>
        <NavLink to="/chat"     className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>Chat</NavLink>
        <NavLink to="/library"  className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>Library</NavLink>
        <NavLink to="/saved"    className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>Saved</NavLink>
        <NavLink to="/settings" className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>Settings</NavLink>
      </div>

      {/* Right side */}
      <div className="navbar-right">
        <span className="navbar-user">{user}</span>
        <button className="navbar-signout" onClick={handleSignOut}>Sign Out</button>
      </div>
    </nav>
  );
}
