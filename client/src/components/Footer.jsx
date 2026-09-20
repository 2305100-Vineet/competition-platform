import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><Trophy size={16} /> Arenafy</div>
          <p className="footer-tagline">Your arena for cricket, football, and PUBG — tournaments, fixtures, and live standings, all in one place.</p>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
        <div>
          <div className="footer-col-title">Disciplines</div>
          <div className="footer-links">
            <Link to="/tournaments">Cricket</Link>
            <Link to="/tournaments">PUBG</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Arenafy. All rights reserved.</span>
        <span>Terms · Privacy</span>
      </div>
    </footer>
  );
}