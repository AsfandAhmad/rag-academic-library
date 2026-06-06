import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user.name || localStorage.getItem('mkUser') || 'Guest';

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="mk-navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">📖</div>
        <span className="navbar-title">Maktab e Kamil</span>
      </div>

      <div className="navbar-links">
        <Link to="/chat" className={`navbar-link ${isActive('/chat') ? 'active' : ''}`}>
          Chat
        </Link>
        <Link to="/library" className={`navbar-link ${isActive('/library') ? 'active' : ''}`}>
          Library
        </Link>
        <Link to="/saved" className={`navbar-link ${isActive('/saved') ? 'active' : ''}`}>
          Saved
        </Link>
        <Link to="/settings" className={`navbar-link ${isActive('/settings') ? 'active' : ''}`}>
          Settings
        </Link>
      </div>

      <div className="navbar-right">
        <span className="navbar-user">{username}</span>
        <button className="navbar-signout" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
