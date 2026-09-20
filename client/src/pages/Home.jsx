import { Link } from 'react-router-dom';
import { Trophy, Users, BarChart3, Shuffle, ShieldCheck, Zap } from 'lucide-react';
import cricketImg from '../assets/images/cricket.webp';
import pubgImg from '../assets/images/pubg.png';
import footballImg from '../assets/images/football.jpg';

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-glow" />
        <div className="home-hero-inner">
          <span className="home-eyebrow">Competition, run properly</span>
          <h1>One platform. Every arena. Real competition.</h1>
          <p className="home-hero-sub">
            Run cricket, football, and PUBG tournaments side by side — fixtures, brackets, and standings
            generated automatically, so you spend your time organizing, not tallying.
          </p>
          <div className="home-hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/tournaments" className="btn btn-secondary">Browse Tournaments</Link>
          </div>
        </div>
      </section>

      <section className="home-features">
        <h2>Built for how competitions actually run</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon-badge"><Shuffle size={20} /></span>
            <h3>Every format covered</h3>
            <p>Round robin leagues, knockout brackets, and points-based scoring — pick what fits your competition.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon-badge"><ShieldCheck size={20} /></span>
            <h3>Fair, seeded brackets</h3>
            <p>Proper tournament seeding with automatic bye handling — works cleanly for any number of teams, not just powers of two.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon-badge"><Zap size={20} /></span>
            <h3>Standings that never lag</h3>
            <p>Submit a result and the table updates immediately — no manual recalculation, no spreadsheets.</p>
          </div>
        </div>
      </section>

      <section className="home-disciplines">
        <h2>Choose your arena</h2>
        <div className="discipline-grid">
          <Link
            to="/tournaments?discipline=cricket"
            className="discipline-card cricket"
            style={{ backgroundImage: `url(${cricketImg})`, backgroundPosition: 'center 20%' }}
          >
            <div className="discipline-card-overlay" />
            <div className="discipline-card-content">
              <span className="discipline-card-label">Cricket</span>
              <span className="discipline-card-desc">Round robin &amp; knockout tournaments, run and wicket standings.</span>
            </div>
          </Link>
          <Link
            to="/tournaments?discipline=pubg"
            className="discipline-card pubg"
            style={{ backgroundImage: `url(${pubgImg})`, backgroundPosition: 'center 65%' }}
          >
            <div className="discipline-card-overlay" />
            <div className="discipline-card-content">
              <span className="discipline-card-label">PUBG</span>
              <span className="discipline-card-desc">Points-league play across match days, placement and kill scoring.</span>
            </div>
          </Link>
          <Link
            to="/tournaments?discipline=football"
            className="discipline-card football"
            style={{ backgroundImage: `url(${footballImg})`, backgroundPosition: 'center' }}
          >
            <div className="discipline-card-overlay" />
            <div className="discipline-card-content">
              <span className="discipline-card-label">Football</span>
              <span className="discipline-card-desc">Round robin leagues or knockout cups, goals decide the table.</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="home-how">
        <h2>How it works</h2>
        <ol className="how-steps">
          <li className="how-step">
            <span className="how-step-num">1</span>
            <Users size={20} />
            <div>
              <strong>Register your team</strong>
              <p>Create a team, build your roster, and join an open tournament.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="how-step-num">2</span>
            <Trophy size={20} />
            <div>
              <strong>Compete</strong>
              <p>Fixtures or brackets generate automatically once registration closes.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="how-step-num">3</span>
            <BarChart3 size={20} />
            <div>
              <strong>Climb the standings</strong>
              <p>Results feed straight into live standings — no manual tallying.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}