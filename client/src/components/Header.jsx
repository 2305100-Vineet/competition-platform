import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-badge"><Trophy size={16} /></span>
        Arenafy
      </Link>
      <nav className="site-nav">
        <NavLink to="/tournaments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Tournaments
        </NavLink>
        {user && (
          <NavLink to="/teams" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            My Teams
          </NavLink>
        )}
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}