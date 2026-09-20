import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getDisciplineImage } from '../utils/disciplineImages';

export default function Tournaments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const discipline = searchParams.get('discipline');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = discipline ? `?discipline=${discipline}` : '';
    apiClient.get(`/tournaments${query}`)
      .then((res) => setTournaments(res.data))
      .finally(() => setLoading(false));
  }, [discipline]);

  const clearFilter = () => setSearchParams({});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tournaments</h1>
          <p className="page-subtitle">Browse and manage competitions</p>
        </div>
        {user ? (
          <Link to="/tournaments/new" className="btn btn-primary">+ Create Tournament</Link>
        ) : (
          <Link to="/login" className="btn btn-secondary">Log in to create a tournament</Link>
        )}
      </div>

      {discipline && (
        <div className="filter-bar">
          <span className={`status-pill filter-pill ${discipline}`} style={{ textTransform: 'capitalize' }}>
            {discipline}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={clearFilter}>Clear filter</button>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading tournaments...</p>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          {discipline ? `No ${discipline} tournaments yet.` : 'No tournaments yet — create the first one.'}
        </div>
      ) : (
        <ul className="card-list">
          {tournaments.map((t) => {
            const fillPct = Math.min(100, Math.round((t.participants.length / t.maxParticipants) * 100));
            const thumb = getDisciplineImage(t.discipline, t._id);
            return (
              <li key={t._id}>
                <Link to={`/tournaments/${t._id}`} style={{ textDecoration: 'none' }}>
                  <div className={`tournament-card ${t.discipline}`}>
                    {thumb && <img src={thumb} alt="" className="tournament-card-thumb" />}
                    <div className="tournament-card-main">
                      <div className="tournament-card-title">{t.name}</div>
                      <div className="tournament-card-meta">
                        {t.discipline} · {t.participants.length}/{t.maxParticipants} teams
                      </div>
                      <div className="tournament-fill-bar">
                        <div className={`tournament-fill-bar-inner ${t.discipline}`} style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>
                    <span className={`status-pill ${t.status === 'Completed' ? 'completed' : t.status === 'RegistrationOpen' ? 'open' : ''}`}>
                      {t.status}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}