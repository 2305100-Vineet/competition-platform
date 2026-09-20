import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getDisciplineImage } from '../utils/disciplineImages';

export default function MyTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/teams')
      .then((res) => setTeams(res.data.filter((t) => t.captainUserId === user.id)))
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Teams</h1>
          <p className="page-subtitle">Teams you captain</p>
        </div>
        <Link to="/teams/new" className="btn btn-primary">+ Create Team</Link>
      </div>

      {loading ? (
        <p className="loading-text">Loading teams...</p>
      ) : teams.length === 0 ? (
        <div className="empty-state">You haven't created a team yet — create one to start registering for tournaments.</div>
      ) : (
        <ul className="card-list">
          {teams.map((t) => {
            const thumb = getDisciplineImage(t.discipline, t._id);
            return (
              <li key={t._id}>
                <Link to={`/teams/${t._id}`} style={{ textDecoration: 'none' }}>
                  <div className={`tournament-card ${t.discipline}`}>
                    {thumb && <img src={thumb} alt="" className="tournament-card-thumb" />}
                    <div className="tournament-card-main">
                      <div className="tournament-card-title">{t.name}</div>
                      <div className="tournament-card-meta">
                        {t.discipline} · {t.roster.length} player{t.roster.length !== 1 ? 's' : ''}
                      </div>
                    </div>
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