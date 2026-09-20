import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SubmitResultForm from '../components/SubmitResultForm';

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [openResultFormFor, setOpenResultFormFor] = useState(null);
  const [editingResultFor, setEditingResultFor] = useState(null);
  const [resolvingRegId, setResolvingRegId] = useState(null);
  const [justUpdatedMatchId, setJustUpdatedMatchId] = useState(null);
  const [showMatchDayForm, setShowMatchDayForm] = useState(false);
  const [matchDayTeamIds, setMatchDayTeamIds] = useState([]);
  const [matchDayError, setMatchDayError] = useState('');

  const load = async () => {
    const [tRes, mRes] = await Promise.all([
      apiClient.get(`/tournaments/${id}`),
      apiClient.get(`/matches?tournamentId=${id}`)
    ]);
    setTournament(tRes.data);
    setMatches(mRes.data);

    if (user) {
      const teamsRes = await apiClient.get('/teams');
      setMyTeams(teamsRes.data.filter((t) => t.captainUserId === user.id && t.discipline === tRes.data.discipline));

      if (tRes.data.organizerId === user.id) {
        const regRes = await apiClient.get(`/registrations?tournamentId=${id}`);
        setRegistrations(regRes.data.filter((r) => r.status === 'pending'));
      }
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (loading) return <div className="page"><p className="loading-text">Loading...</p></div>;
  if (!tournament) return <div className="page"><div className="empty-state">Tournament not found</div></div>;

  const isOrganizer = user && tournament.organizerId === user.id;
  const isPointsLeague = tournament.standings?.[0]?.totalPoints !== undefined;
  const alreadyRegisteredTeamIds = tournament.participants.map((p) => p.teamId);
  const eligibleTeams = myTeams.filter((t) => !alreadyRegisteredTeamIds.includes(t._id));
  const accentClass = `accent-${tournament.discipline}`;

  const runAction = async (fn, successMessage) => {
    try {
      await fn();
      await load();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const registerMyTeam = async (e) => {
    e.preventDefault();
    await runAction(
      () => apiClient.post('/registrations', { tournamentId: id, teamId: selectedTeamId }),
      'Registration submitted — waiting on organizer approval'
    );
    setSelectedTeamId('');
  };

  const resolveRegistration = (regId, action) => {
    setResolvingRegId(regId);
    setTimeout(() => {
      runAction(
        () => apiClient.patch(`/registrations/${regId}/${action}`),
        action === 'approve' ? 'Team approved' : 'Team rejected'
      ).finally(() => setResolvingRegId(null));
    }, 260);
  };

  const toggleMatchDayTeam = (teamId) => {
    setMatchDayTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const submitMatchDay = async (e) => {
    e.preventDefault();
    setMatchDayError('');
    if (matchDayTeamIds.length < 2) {
      setMatchDayError('Select at least 2 teams for this match day');
      return;
    }
    try {
      await apiClient.post('/matches', {
        tournamentId: id,
        format: 'points_league',
        teamIds: matchDayTeamIds
      });
      setMatchDayTeamIds([]);
      setShowMatchDayForm(false);
      await load();
      toast.success('Match day created');
    } catch (err) {
      setMatchDayError(err.response?.data?.message || 'Failed to create match day');
    }
  };

  const matchLabel = (m) => {
    if (m.participants.length === 2) return m.participants.map((p) => p.teamNameSnapshot).join(' vs ');
    if (m.participants.length === 1) return `${m.participants[0].teamNameSnapshot} — Bye`;
    if (m.participants.length > 2) return m.participants.map((p) => p.teamNameSnapshot).join(', ');
    return 'TBD vs TBD';
  };

  return (
    <div className={`page ${accentClass}`}>
      <div className="page-header">
        <div>
          <h1>{tournament.name}</h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{tournament.discipline} tournament</p>
        </div>
        <span className={`status-pill ${tournament.status === 'Completed' ? 'completed' : tournament.status === 'RegistrationOpen' ? 'open' : ''}`}>
          {tournament.status}
        </span>
      </div>

      {isOrganizer && (
        <div className="action-bar">
          {tournament.status === 'Draft' && (
            <button className="btn btn-primary" onClick={() => runAction(
              () => apiClient.patch(`/tournaments/${id}/open-registration`),
              'Registration opened'
            )}>
              Open Registration
            </button>
          )}
          {tournament.discipline !== 'pubg' && matches.length === 0 && (
            <>
              <button className="btn btn-secondary" onClick={() => runAction(
                () => apiClient.post('/matches/generate/round-robin', { tournamentId: id }),
                'Round robin fixtures generated'
              )}>
                Generate Round Robin
              </button>
              <button className="btn btn-secondary" onClick={() => runAction(
                () => apiClient.post('/matches/generate/single-elimination', { tournamentId: id }),
                'Bracket generated'
              )}>
                Generate Bracket
              </button>
            </>
          )}
          {tournament.discipline === 'pubg' && tournament.participants.length >= 2 && (
            <button className="btn btn-secondary" onClick={() => setShowMatchDayForm((v) => !v)}>
              {showMatchDayForm ? 'Cancel' : '+ Create Match Day'}
            </button>
          )}
        </div>
      )}

      {showMatchDayForm && (
        <div className="section-card">
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            Select the squads playing in this match day (at least 2).
          </p>
          <form onSubmit={submitMatchDay}>
            <div className="match-day-team-list">
              {tournament.participants.map((p) => (
                <label key={p.teamId} className="match-day-team-option">
                  <input
                    type="checkbox"
                    checked={matchDayTeamIds.includes(p.teamId)}
                    onChange={() => toggleMatchDayTeam(p.teamId)}
                  />
                  {p.teamNameSnapshot}
                </label>
              ))}
            </div>
            {matchDayError && <p className="error-text">{matchDayError}</p>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
              Create Match Day ({matchDayTeamIds.length} selected)
            </button>
          </form>
        </div>
      )}

      <div className="tournament-content">
        {tournament.status === 'RegistrationOpen' && !user && (
          <div className="section-card">
            <p className="page-subtitle" style={{ margin: 0 }}>
              <Link to="/login">Log in</Link> to register a team for this tournament.
            </p>
          </div>
        )}

        {tournament.status === 'RegistrationOpen' && user && eligibleTeams.length > 0 && (
          <>
            <h2>Register Your Team</h2>
            <div className="section-card">
              <form onSubmit={registerMyTeam}>
                <div className="field-group">
                  <label className="field-label">Your team</label>
                  <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} required>
                    <option value="">Select a team</option>
                    {eligibleTeams.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Register</button>
              </form>
            </div>
          </>
        )}

        {isOrganizer && registrations.length > 0 && (
          <>
            <h2>Pending Registrations</h2>
            <div className="section-card">
              {registrations.map((r) => (
                <div key={r._id} className={`registration-row ${resolvingRegId === r._id ? 'resolving' : ''}`}>
                  <span>{r.teamId?.name || r.teamId}</span>
                  <div className="registration-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => resolveRegistration(r._id, 'approve')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => resolveRegistration(r._id, 'reject')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2>Participants</h2>
        {tournament.participants.length === 0 ? (
          <div className="empty-state">No teams registered yet.</div>
        ) : (
          <ul className="participants-grid">
            {tournament.participants.map((p) => (
              <li key={p.teamId} className="participant-chip">{p.teamNameSnapshot}</li>
            ))}
          </ul>
        )}

        {tournament.standings?.length > 0 && (
          <>
            <h2>Standings</h2>
            <div className="section-card">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    {isPointsLeague ? (
                      <>
                        <th className="num">Matches</th>
                        <th className="num">Best</th>
                        <th className="num">Points</th>
                      </>
                    ) : (
                      <>
                        <th className="num">P</th>
                        <th className="num">W</th>
                        <th className="num">L</th>
                        <th className="num">T</th>
                        <th className="num">Pts</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tournament.standings.map((s) => (
                    <tr key={s.teamId}>
                      <td>{s.teamNameSnapshot}</td>
                      {isPointsLeague ? (
                        <>
                          <td className="num">{s.matchesPlayed}</td>
                          <td className="num">#{s.bestPlacement}</td>
                          <td className="num">{s.totalPoints}</td>
                        </>
                      ) : (
                        <>
                          <td className="num">{s.played}</td>
                          <td className="num">{s.won}</td>
                          <td className="num">{s.lost}</td>
                          <td className="num">{s.tied}</td>
                          <td className="num">{s.points}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h2>Matches</h2>
        {matches.length === 0 ? (
          <div className="empty-state">No matches yet.</div>
        ) : (
          matches.map((m) => (
            <div key={m._id} className={`match-row ${justUpdatedMatchId === m._id ? 'just-updated' : ''}`}>
              <div className="match-round">
                {m.roundLabel || `Round ${m.round}`} · {m.status}
                {m.meta?.isBye && <span className="bye-tag">Bye</span>}
              </div>
              <div className="match-teams">{matchLabel(m)}</div>
              {m.outcome?.length > 0 && (
                <div className="match-score">{m.outcome.map((o) => o.displayStat).join('  ·  ')}</div>
              )}

              {isOrganizer && m.status === 'Scheduled' && m.participants.length >= 2 && (
                openResultFormFor === m._id ? (
                  <SubmitResultForm
                    match={m}
                    onSubmitted={() => {
                      setOpenResultFormFor(null);
                      setJustUpdatedMatchId(m._id);
                      load();
                      toast.success('Result submitted');
                      setTimeout(() => setJustUpdatedMatchId(null), 1300);
                    }}
                  />
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => setOpenResultFormFor(m._id)} style={{ marginTop: '0.5rem' }}>
                    Submit Result
                  </button>
                )
              )}

              {isOrganizer && m.status === 'Completed' && !m.meta?.isBye && (
                editingResultFor === m._id ? (
                  <SubmitResultForm
                    match={m}
                    mode="correct"
                    initialRawResult={m.rawResult}
                    onSubmitted={() => {
                      setEditingResultFor(null);
                      setJustUpdatedMatchId(m._id);
                      load();
                      toast.success('Result corrected');
                      setTimeout(() => setJustUpdatedMatchId(null), 1300);
                    }}
                  />
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingResultFor(m._id)} style={{ marginTop: '0.5rem' }}>
                    Correct Result
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}